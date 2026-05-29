# ADR-007 — Notificações em Tempo Real via Supabase Realtime

> Status: ACEITO | Data: 2026-05-29 | Confiança: 🟢 CONFIRMADO

---

## Contexto

A feature de @menções em comentários precisa entregar notificações ao usuário mencionado imediatamente, sem que ele precise recarregar a página.

Evidências:
- Commit `ad736d3 feat: implementar suporte a notificações em tempo real para o usuário atual` (2026-05-29)
- Commit `1ccae93 feat: adicionar suporte a notificações para usuários mencionados em comentários` (2026-05-29) — geração server-side das notificações via @mention regex
- Implementação em `app/page.tsx`:

```typescript
const channel = supabase
  .channel(`notifications_user_${currentUser.id}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${currentUser.id}`
  }, (payload) => {
    const newNotif = payload.new as Notification
    setNotifications(prev => [newNotif, ...prev])
  })
  .subscribe()
```

## Decisão

Usar Supabase Realtime com `postgres_changes` para escutar `INSERT` na tabela `notifications` filtrado por `user_id`, adicionando a nova notificação ao state React sem polling.

## Alternativas consideradas

| Alternativa | Razão de descarte |
|-------------|------------------|
| Polling (`setInterval` + `GET /api/notifications`) | Latência de até N segundos; carga desnecessária no banco |
| Server-Sent Events (SSE) customizado | Requer implementação de endpoint streaming no Next.js |
| WebSockets customizado | Ainda mais complexo; Supabase já fornece a infraestrutura |
| Push Notifications (Web Push API) | Requer service worker, VAPID keys, permissão do browser — complexidade alta |

## Consequências

**Positivas:**
- Entrega de notificações em tempo real sem polling
- Filtro por `user_id` garante que cada usuário recebe apenas as próprias notificações
- Cleanup correto via `supabase.removeChannel(channel)` no cleanup do useEffect
- Reutiliza infraestrutura Supabase já presente

**Negativas:**
- 🟡 Requer configuração de Realtime no projeto Supabase (pode estar desabilitado por padrão)
- 🟡 `postgres_changes` requer que a tabela `notifications` esteja na publication `supabase_realtime` — configuração adicional no banco
- 🟡 Canal nomeado por `user_id` — sem reconexão automática em caso de queda (Supabase Realtime SDK lida com isso internamente, mas sem tratamento explícito no código)
- 🟡 Evento `INSERT` capturado para todas as colunas (`*`) — sem filtro de campos específicos

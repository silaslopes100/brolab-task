# Browser Client — Requirements

> `lib-supabase/browser-client/requirements.md`

## Função: `createClient()` (browser)

**Localização:** `lib/supabase/client.ts`

### Contrato
- **Sync** — retorna cliente imediatamente
- Usa `createBrowserClient` de `@supabase/ssr`
- Mesma anon key que `server.ts`: `NEXT_PUBLIC_SUPABASE_ANON_KEY ?? NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Gerencia sessão via browser storage automaticamente

### Uso Principal
`app/page.tsx` — subscriptions de Realtime para notificações em tempo real:
```ts
const supabase = createClient()
supabase.channel(`notifications_user_${userId}`)
  .on('postgres_changes', { event: 'INSERT', table: 'notifications' }, handler)
  .subscribe()
```

### Segurança
- 🟢 Usa chave anon (RLS enforced no Supabase)
- 🟢 Canal filtrado por `user_id=eq.{userId}`
- 🟡 Não valida se userId pertence ao usuário autenticado — depende do RLS da tabela

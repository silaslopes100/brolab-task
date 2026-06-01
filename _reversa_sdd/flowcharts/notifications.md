# Flowchart — Módulo `notifications`

> `app/api/notifications/route.ts`

## GET — Buscar notificações do usuário

```mermaid
flowchart TD
    A[GET /api/notifications?userId=] --> B{userId presente?}
    B -- Não --> C[Retorna lista vazia - graceful degradation]
    C --> D[200 OK - notifications: empty array]
    B -- Sim --> E{adminClient disponível?}
    E -- Não --> ERR1[500 erro de admin]
    E -- Sim --> F[SELECT * FROM notifications WHERE user_id = userId ORDER BY created_at DESC]
    F --> G{Erro?}
    G -- Sim --> ERR2[500 FALHA_AO_BUSCAR_NOTIFICACOES]
    G -- Não --> H[Mapeia campos snake_case → camelCase]
    H --> I[200 OK - notifications array]
```

## PATCH — Marcar notificação como lida

```mermaid
flowchart TD
    A[PATCH /api/notifications] --> B[Extrai id e isRead do body]
    B --> C{id presente?}
    C -- Não --> ERR1[400 ID obrigatório]
    C -- Sim --> D{adminClient disponível?}
    D -- Não --> ERR2[500 erro de admin]
    D -- Sim --> E[UPDATE notifications SET read = isRead WHERE id = id]
    E --> F{Erro?}
    F -- Sim --> ERR3[500 success: false]
    F -- Não --> G[200 OK - success: true]
```

## DELETE — Limpar todas as notificações do usuário

```mermaid
flowchart TD
    A[DELETE /api/notifications?userId=] --> B{userId presente?}
    B -- Não --> ERR1[400 userId obrigatório]
    B -- Sim --> C{adminClient disponível?}
    C -- Não --> ERR2[500 erro de admin]
    C -- Sim --> D[DELETE FROM notifications WHERE user_id = userId]
    D --> E[200 OK - success: true]
```

## Realtime (Frontend)

```mermaid
flowchart TD
    A[useEffect quando currentUser muda] --> B[Fetch inicial: GET /api/notifications?userId]
    B --> C[createClient - browser Supabase client]
    C --> D[supabase.channel notificações_user_ID]
    D --> E[.on postgres_changes INSERT notifications user_id=eq.ID]
    E --> F[Subscreve .subscribe]
    F --> G{Novo INSERT recebido via Realtime?}
    G -- Sim --> H[Mapeia payload.new → Notification object]
    H --> I[setNotifications prev => newNotif, ...prev]
    G -- Não --> G
    F --> J[return cleanup: supabase.removeChannel]
```

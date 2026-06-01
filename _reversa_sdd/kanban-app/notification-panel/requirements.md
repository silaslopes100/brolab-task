# Notification Panel — Requirements

> `kanban-app/notification-panel/requirements.md`

## Descrição
Bell button no header + modal de listagem de notificações. Canal Realtime para novas notificações em tempo real.

## NotificationBell
- Badge vermelho com contagem de não-lidas
- `animate-pulse` quando há não-lidas
- Clique → abre `NotificationsModal`

## NotificationsModal
- Lista todas as notificações do usuário atual
- Item não-lido: border verde + ponto verde
- Item lido: border cinza + fundo escuro
- Clique no item → `onMarkRead(id)` (otimistic via API PATCH)
- `[ CLEAR_ALL ]` → DELETE `/api/notifications?userId=` → `setNotifications([])`
- Vazio: exibe `> NO_NOTIFICATIONS`

## Realtime
- Canal: `notifications_user_{userId}`
- Evento: INSERT em tabela `notifications` filtrado por `user_id=eq.{userId}`
- Mapeamento snake_case → camelCase: `task_id→taskId`, `from_user→fromUser`, `created_at→createdAt`
- Cleanup automático no unmount do componente (removeChannel)

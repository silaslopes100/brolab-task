# Notificações

> `requirements.md` | Módulo: `notificacoes` | granularity: hybrid
> Fonte: `app/api/notifications/route.ts` | doc_level: detalhado

---

## Visão Geral

Módulo completo de gestão de notificações de usuário. Suporta leitura (GET), marcação como lido (PATCH) e limpeza em lote (DELETE). Diferente do módulo `etiquetas`, **possui persistência real** via tabela `notifications`. Notificações são criadas indiretamente pelo módulo `comentarios` ao detectar `@mentions`. 🟢

---

## Responsabilidades

- Listar notificações de um usuário por `userId` 🟢
- Marcar notificação individual como lida/não-lida (PATCH) 🟢
- Limpar todas as notificações de um usuário (DELETE) 🟢

---

## Regras de Negócio

- RN-01: GET sem `userId` retorna `{ notifications: [] }` (sem erro, sem banco) 🟡
- RN-02: GET com `userId` → SELECT WHERE user_id = userId ORDER BY created_at DESC 🟢
- RN-03: PATCH requer `id` no body (HTTP 400 se ausente) 🟢
- RN-04: PATCH aceita `isRead: boolean` para marcar/desmarcar leitura 🟢
- RN-05: DELETE requer `userId` na query string (HTTP 400 se ausente) 🟢
- RN-06: DELETE apaga **todas** as notificações do usuário em lote 🟢
- RN-07: Notificações são inseridas pelo módulo `comentarios` (via `@mentions`) 🟢

---

## Tipo de Notificação

```ts
type NotificationItem = {
  id: string
  type: string           // "mention" (único tipo atual)
  message: string        // texto da notificação
  taskId: string | null
  taskTitle: string | null
  fromUser: string       // username do autor da menção
  createdAt: string
  read: boolean
}
```

---

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|------------|-------------------|
| RF-01 | GET retorna notificações do usuário ordenadas por data desc | Must | GET `?userId=uuid` → `{ notifications: [...] }` |
| RF-02 | GET sem userId retorna lista vazia sem erro | Should | GET sem param → `{ notifications: [] }` |
| RF-03 | PATCH marca notificação como lida/não-lida | Must | PATCH `{ id, isRead: true }` → `{ success: true }` |
| RF-04 | DELETE limpa todas as notificações do usuário | Must | DELETE `?userId=uuid` → `{ success: true }` |

---

## Critérios de Aceite

```gherkin
# Listar notificações
Quando GET /api/notifications?userId=uuid-user
Então HTTP 200 com { notifications: [...] } ordenadas por created_at DESC

# Sem userId
Quando GET /api/notifications
Então HTTP 200 { notifications: [] }

# Marcar como lido
Quando PATCH /api/notifications { id: "notif-uuid", isRead: true }
Então HTTP 200 { success: true }
E notifications SET read = true WHERE id = "notif-uuid"

# Limpar todas
Quando DELETE /api/notifications?userId=uuid-user
Então HTTP 200 { success: true }
E DELETE FROM notifications WHERE user_id = uuid-user
```

---

## Issues Conhecidas

| Severidade | Problema |
|-----------|---------|
| 🟡 MÉDIO | GET sem userId retorna lista vazia silenciosamente (sem 400) |
| 🟡 MÉDIO | GET com erro no banco retorna `{ notifications: [] }` com HTTP 500 (corpo não reflete status) |
| 🔴 CRÍTICO | Sem autenticação — qualquer cliente pode ler/limpar notificações de qualquer usuário |

---

## Rastreabilidade

| Arquivo | Função | Cobertura |
|---------|--------|-----------|
| `app/api/notifications/route.ts` | `GET`, `PATCH`, `DELETE` | 🟢 |

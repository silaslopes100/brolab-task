# Notificações — Contratos de API

> `contracts.md` | Módulo: `notificacoes` | doc_level: detalhado

---

## GET /api/notifications?userId=uuid

**Sucesso (200):**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "mention",
      "message": "alice mencionou você na tarefa \"Deploy produção\"",
      "taskId": "uuid-task",
      "taskTitle": "Deploy produção",
      "fromUser": "alice",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "read": false
    }
  ]
}
```

**Sem userId (200):**
```json
{ "notifications": [] }
```

**Erro (500):**
```json
{ "notifications": [] }
```
> 🟡 Corpo não reflete o erro — status HTTP 500 mas `notifications: []`

---

## PATCH /api/notifications

**Requisição:**
```json
{ "id": "notif-uuid", "isRead": true }
```

**Sucesso (200):**
```json
{ "success": true }
```

**Erros:**
```json
// 400 — sem id
{ "error": "ID obrigatório" }

// 500
{ "success": false }
```

---

## DELETE /api/notifications?userId=uuid

**Sucesso (200):**
```json
{ "success": true }
```

**Erros:**
```json
// 400 — sem userId
{ "success": false, "error": "userId obrigatório" }

// 500
{ "success": false }
```

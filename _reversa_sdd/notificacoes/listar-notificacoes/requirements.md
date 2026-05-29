# Listar Notificações — Requisitos

> `requirements.md` | Caso de uso: `notificacoes/listar-notificacoes`

---

## Visão Geral

GET retorna notificações de um usuário ordenadas da mais recente para a mais antiga. 🟢

---

## Regras de Negócio

- `userId` na query string — sem ele retorna `[]` (sem 400) 🟡
- Ordenação: `created_at DESC` 🟢

---

## Critério de Aceite

```gherkin
Quando GET /api/notifications?userId=uuid
Então HTTP 200 { notifications: [...] } ordenadas por data decrescente

Quando GET /api/notifications
Então HTTP 200 { notifications: [] }
```

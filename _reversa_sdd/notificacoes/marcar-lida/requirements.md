# Marcar Notificação Lida — Requisitos

> `requirements.md` | Caso de uso: `notificacoes/marcar-lida`

---

## Visão Geral

PATCH atualiza o campo `read` de uma notificação. Permite marcar ou desmarcar como lida. 🟢

---

## Regras de Negócio

- `id` obrigatório no body (HTTP 400 se ausente) 🟢
- `isRead`: boolean — true para lida, false para não-lida 🟢
- Sem verificação de `user_id` — qualquer cliente pode marcar qualquer notificação 🔴

---

## Critério de Aceite

```gherkin
Quando PATCH /api/notifications { id: "uuid", isRead: true }
Então HTTP 200 { success: true }
E notifications SET read = true WHERE id = "uuid"
```

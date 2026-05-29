# Limpar Notificações — Requisitos

> `requirements.md` | Caso de uso: `notificacoes/limpar-notificacoes`

---

## Visão Geral

DELETE apaga todas as notificações de um usuário em batch. 🟢

---

## Regras de Negócio

- `userId` obrigatório na query string (HTTP 400 se ausente) 🟢
- Apaga **todas** as notificações do usuário — sem filtros adicionais 🟢

---

## Critério de Aceite

```gherkin
Quando DELETE /api/notifications?userId=uuid-user
Então HTTP 200 { success: true }
E DELETE FROM notifications WHERE user_id = uuid-user
```

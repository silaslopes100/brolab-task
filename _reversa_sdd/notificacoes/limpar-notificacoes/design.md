# Limpar Notificações — Design

> `design.md` | Caso de uso: `notificacoes/limpar-notificacoes`

---

## Sequência

```
DELETE ?userId=uuid
1. createAdminClient()
2. !userId → return 400
3. DELETE FROM notifications WHERE user_id = userId
4. return { success: true }
```

Operação idempotente: segunda execução deleta 0 registros sem erro.

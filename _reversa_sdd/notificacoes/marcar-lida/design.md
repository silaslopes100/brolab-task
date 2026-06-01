# Marcar Notificação Lida — Design

> `design.md` | Caso de uso: `notificacoes/marcar-lida`

---

## Sequência

```
PATCH { id, isRead }
1. createAdminClient()
2. !id → return 400
3. UPDATE notifications SET read = isRead WHERE id = id
4. return { success: true }
```

# Listar Notificações — Design

> `design.md` | Caso de uso: `notificacoes/listar-notificacoes`

---

## Sequência

```
GET ?userId=uuid
1. createAdminClient()
2. !userId → return { notifications: [] }
3. SELECT * FROM notifications WHERE user_id = userId ORDER BY created_at DESC
4. map: DB → API fields
5. return { notifications }
```

Ver `notificacoes/design.md` para mapeamento completo de campos.

# Limpar Notificações — Tarefas

> `tasks.md` | Caso de uso: `notificacoes/limpar-notificacoes`

---

- [ ] T-01 — Validar `userId` na query string (400 se ausente)
- [ ] T-02 — DELETE WHERE user_id = userId
- [ ] TT-01 — DELETE válido → todas notificações do usuário removidas
- [ ] TT-02 — DELETE sem userId → 400
- [ ] TT-03 — DELETE duplo → idempotente (sem erro)

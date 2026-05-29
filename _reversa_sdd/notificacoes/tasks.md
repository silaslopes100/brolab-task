# Notificações — Tarefas de Implementação

> `tasks.md` | Módulo: `notificacoes` | doc_level: detalhado

---

## Pré-requisitos

- [ ] Tabela `notifications` criada com colunas: `id`, `user_id`, `type`, `message`, `task_id`, `task_title`, `from_user`, `read`, `created_at`
- [ ] FK `user_id → team_members.id` configurada

---

## Tarefas

- [ ] T-01 — GET: SELECT WHERE user_id = userId ORDER BY created_at DESC; retornar `[]` se sem userId
  - Confiança: 🟢

- [ ] T-02 — PATCH: validar `id` (400 se ausente); UPDATE SET read = isRead WHERE id
  - Confiança: 🟢

- [ ] T-03 — DELETE: validar `userId` (400 se ausente); DELETE WHERE user_id = userId
  - Confiança: 🟢

---

## Tarefas de Teste

- [ ] TT-01 — GET com userId → notificações ordenadas por data desc
- [ ] TT-02 — GET sem userId → lista vazia sem erro
- [ ] TT-03 — PATCH com id válido → read=true
- [ ] TT-04 — PATCH sem id → 400
- [ ] TT-05 — DELETE com userId → todas notificações removidas
- [ ] TT-06 — DELETE sem userId → 400

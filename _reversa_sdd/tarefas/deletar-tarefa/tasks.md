# Deletar Tarefa — Tarefas de Implementação

> `tasks.md` | Caso de uso: `tarefas/deletar-tarefa`

---

## Tarefas

- [ ] T-01 — Extrair `id` de `new URL(request.url).searchParams.get("id")`
  - Critério de pronto: HTTP 400 se `id` ausente
  - Confiança: 🟢

- [ ] T-02 — Executar `DELETE FROM tasks WHERE id = id`
  - Critério de pronto: task removida do banco, task_files cascateados
  - Confiança: 🟢

- [ ] T-03 — Confirmar `ON DELETE CASCADE` na FK `task_files.task_id → tasks.id`
  - Confiança: 🟢 (verificar migration)

- [ ] T-04 — Adicionar `ON DELETE CASCADE` na FK `task_comments.task_id → tasks.id`
  - Critério de pronto: comentários também são removidos ao deletar task
  - Confiança: 🟡 (não confirmado no legado — pode estar declarado no banco)

---

## Tarefas de Teste

- [ ] TT-01 — DELETE com id válido → HTTP 200 e task removida
- [ ] TT-02 — DELETE sem id → HTTP 400
- [ ] TT-03 — DELETE cascateia task_files

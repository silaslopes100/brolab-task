# Listar Tarefas — Tarefas de Implementação

> `tasks.md` | Caso de uso: `tarefas/listar-tarefas`

---

## Pré-requisitos

- [ ] Tabelas `tasks`, `task_comments`, `task_files` criadas
- [ ] Bucket `task-files` configurado no Supabase Storage

---

## Tarefas

- [ ] T-01 — Implementar os 3 SELECTs sequenciais no GET handler
  - Confiança: 🟢

- [ ] T-02 — Implementar agrupamento em memória `comments/files por task_id`
  - Confiança: 🟢

- [ ] T-03 — Resolver `getPublicUrl()` para cada arquivo na iteração
  - Confiança: 🟢

- [ ] T-04 — Mapear resposta final com `columnId`, `labels`, `comments`, `files`
  - Confiança: 🟢

---

## Melhoria Futura (fora do escopo do legado)

- [ ] Paralelizar os 3 SELECTs com `Promise.all()` para reduzir latência
- [ ] Adicionar paginação com `range(offset, limit)`

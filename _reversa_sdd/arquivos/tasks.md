# Arquivos — Tarefas de Implementação

> `tasks.md` | Módulo: `arquivos` | doc_level: detalhado

---

## Pré-requisitos

- [ ] Tabela `task_files`: `id UUID`, `task_id FK→tasks.id ON DELETE CASCADE`, `name TEXT`, `size INT`, `type TEXT`, `path TEXT`, `created_at`
- [ ] Bucket `task-files` no Supabase Storage (público)

---

## Tarefas

- [ ] T-01 — Implementar GET com filtro por `taskId` + validação de presença
  - Critério: HTTP 400 se `taskId` ausente; retorna `{ files }` com URLs resolvidas
  - Confiança: 🟢

- [ ] T-02 — Implementar DELETE fase 0: SELECT `path` por `fileId`; HTTP 404 se não encontrado
  - Confiança: 🟢

- [ ] T-03 — Implementar DELETE fase 1: `storage.remove([path])`
  - Critério: falha aborta antes do DELETE no banco
  - Confiança: 🟢

- [ ] T-04 — Implementar DELETE fase 2: `DELETE FROM task_files WHERE id = fileId`
  - Confiança: 🟢

---

## Tarefas de Teste

- [ ] TT-01 — GET com `taskId` válido → lista arquivos com URLs
- [ ] TT-02 — GET sem `taskId` → HTTP 400
- [ ] TT-03 — DELETE válido → arquivo removido do Storage e do banco
- [ ] TT-04 — DELETE com id inexistente → HTTP 404
- [ ] TT-05 — DELETE sem `id` → HTTP 400

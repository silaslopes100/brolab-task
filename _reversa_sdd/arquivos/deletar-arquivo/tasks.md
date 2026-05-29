# Deletar Arquivo — Tarefas

> `tasks.md` | Caso de uso: `arquivos/deletar-arquivo`

---

## Tarefas

- [ ] T-01 — Fase 0: validar `id` na query string (400 se ausente)
- [ ] T-02 — Fase 1: SELECT por `id`, 404 se não encontrado
- [ ] T-03 — Fase 2: `storage.remove([path])`, abortar se erro
- [ ] T-04 — Fase 3: `DELETE FROM task_files WHERE id`

## Tarefas de Teste

- [ ] TT-01 — DELETE válido → Storage + banco deletados
- [ ] TT-02 — DELETE id inexistente → 404
- [ ] TT-03 — DELETE sem id → 400

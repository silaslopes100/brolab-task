# Criar Tarefa — Tarefas de Implementação

> `tasks.md` | Caso de uso: `tarefas/criar-tarefa`

---

## Tarefas

- [ ] T-01 — Implementar POST handler com INSERT e retorno formatado
  - Critério de pronto: POST retorna task com `columnId`, `labels[]`, `comments: []`, `files: []`
  - Confiança: 🟢

- [ ] T-02 — Aplicar valores default (`description=""`, `status="BACKLOG"`, `position=0`)
  - Confiança: 🟢

- [ ] T-03 — Mapear `labels[].name → TEXT[]` no INSERT e formatar de volta no retorno
  - Confiança: 🟢

---

## Tarefas de Teste

- [ ] TT-01 — POST com todos campos → task criada com valores corretos
- [ ] TT-02 — POST sem `columnId` → `task.columnId = "BACKLOG"`
- [ ] TT-03 — POST sem `title` → HTTP 500 (erro do DB)

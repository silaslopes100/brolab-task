# Tarefas — Tarefas de Implementação

> `tasks.md` | Módulo: `tarefas` | doc_level: detalhado

---

## Pré-requisitos

- [ ] Tabela `tasks` com colunas: `id`, `title`, `description`, `status TEXT`, `position INT`, `assignees TEXT[]`, `labels TEXT[]`, `created_at`
- [ ] Tabela `task_comments` com `task_id FK → tasks.id`
- [ ] Tabela `task_files` com `task_id FK → tasks.id ON DELETE CASCADE`
- [ ] Bucket Supabase Storage `task-files`

---

## Tarefas

- [ ] T-01 — Implementar `GET /api/tasks` com 3 queries + merge em memória
  - Critério de pronto: resposta inclui tasks com `comments[]` e `files[]` aninhados
  - Confiança: 🟢

- [ ] T-02 — Implementar `getLabelColor()` com hash djb2-like + paleta de 7 cores
  - Critério de pronto: mesmo nome sempre retorna a mesma cor; cores do set `LABEL_COLORS`
  - Confiança: 🟢

- [ ] T-03 — Resolver URLs públicas de arquivos no GET via `storage.getPublicUrl(path)`
  - Critério de pronto: cada file no retorno contém URL pública válida
  - Confiança: 🟢

- [ ] T-04 — Implementar `POST /api/tasks` com mapeamento `columnId → status`
  - Critério de pronto: task criada com `status = columnId ?? "BACKLOG"` e `labels = labels.map(l => l.name)`
  - Confiança: 🟢

- [ ] T-05 — Implementar `PATCH /api/tasks` com atualização parcial
  - Critério de pronto: apenas campos definidos no body são incluídos no `UPDATE`
  - Confiança: 🟢

- [ ] T-06 — Implementar `DELETE /api/tasks?id=uuid`
  - Critério de pronto: HTTP 400 se id ausente; HTTP 200 `{ success: true }` se deletado
  - Confiança: 🟢

- [ ] T-07 — Garantir `CASCADE DELETE` em `task_files` FK para `tasks.id`
  - Critério de pronto: deletar task remove automaticamente seus arquivos do banco
  - Confiança: 🟢

---

## Tarefas de Teste

- [ ] TT-01 — GET retorna tasks com arrays aninhados corretos
- [ ] TT-02 — `getLabelColor("URGENTE")` retorna sempre a mesma cor
- [ ] TT-03 — POST cria task com `status = columnId`
- [ ] TT-04 — PATCH com apenas `columnId` não altera outros campos
- [ ] TT-05 — DELETE sem id retorna HTTP 400
- [ ] TT-06 — DELETE válido remove task e arquivos associados

---

## Dívidas Técnicas (não bloquear sprint principal)

- [ ] DT-01 — Adicionar paginação ao GET (`range()` + `limit()`)
- [ ] DT-02 — Adicionar `CASCADE DELETE` explícito em `task_comments` FK
- [ ] DT-03 — Adicionar autenticação/autorização nas rotas

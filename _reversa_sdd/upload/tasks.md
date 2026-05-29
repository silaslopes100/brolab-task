# Upload — Tarefas de Implementação

> `tasks.md` | Módulo: `upload` | doc_level: detalhado

---

## Pré-requisitos

- [ ] Tabela `task_files` criada (ver `arquivos/tasks.md`)
- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` configurada

---

## Tarefas

- [ ] T-01 — Implementar POST multipart: `formData.get("file")` + `formData.get("taskId")`, HTTP 400 se ausentes
  - Confiança: 🟢

- [ ] T-02 — Auto-criação de bucket `task-files`: `getBucket()` → `createBucket()` se erro/null
  - Confiança: 🟢

- [ ] T-03 — Geração de path único: `${taskId}/${randomUUID()}.${ext}`
  - Confiança: 🟢

- [ ] T-04 — Upload do buffer com `upsert: false`
  - `file.arrayBuffer()` → `new Uint8Array()` → `storage.upload(path, buffer, {contentType, upsert: false})`
  - Confiança: 🟢

- [ ] T-05 — Resolver URL pública e INSERT em `task_files`
  - Confiança: 🟢

---

## Tarefas de Teste

- [ ] TT-01 — POST válido → arquivo no Storage + registro no banco + URL retornada
- [ ] TT-02 — POST sem `file` → HTTP 400
- [ ] TT-03 — POST sem `taskId` → HTTP 400
- [ ] TT-04 — Bucket ausente → auto-criado e upload prossegue

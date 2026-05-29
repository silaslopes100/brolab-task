# Enviar Arquivo — Tarefas

> `tasks.md` | Caso de uso: `upload/enviar-arquivo`

---

## Tarefas

- [ ] T-01 — Validar presença de `file` e `taskId` (400 se ausentes)
- [ ] T-02 — Auto-criar bucket se `getBucket()` falha
- [ ] T-03 — Gerar `fileName` com UUID e extensão original
- [ ] T-04 — Converter `file.arrayBuffer()` → `Uint8Array` → `storage.upload()`
- [ ] T-05 — Resolver URL pública + INSERT em `task_files`

## Tarefas de Teste

- [ ] TT-01 — POST com `file` + `taskId` → arquivo no Storage + banco
- [ ] TT-02 — POST sem `file` → 400
- [ ] TT-03 — POST sem `taskId` → 400

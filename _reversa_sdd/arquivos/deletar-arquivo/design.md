# Deletar Arquivo — Design Técnico

> `design.md` | Caso de uso: `arquivos/deletar-arquivo`

---

## Fases de Execução

```
DELETE ?id=uuid

Fase 0 — Validação:
  !id → 400

Fase 1 — Busca:
  SELECT path FROM task_files WHERE id = fileId (.single())
  !record → 404 "ARQUIVO_NAO_ENCONTRADO"

Fase 2 — Storage:
  storage.from("task-files").remove([fileRecord.path])
  erro → 500

Fase 3 — Banco:
  DELETE FROM task_files WHERE id = fileId
  erro → 500

→ 200 { success: true }
```

---

## Risco de Inconsistência

Se storage remove com sucesso mas banco falha → arquivo removido fisicamente mas registro persiste. Sem transação atômica entre as duas operações.

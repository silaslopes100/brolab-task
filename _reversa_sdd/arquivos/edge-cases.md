# Arquivos — Casos de Borda

> `edge-cases.md` | Módulo: `arquivos` | doc_level: detalhado

---

## EC-01: Arquivo removido do Storage mas não do banco

- **Cenário:** `storage.remove()` tem sucesso, mas `DELETE FROM task_files` falha
- **Comportamento:** Retorna HTTP 500 `"FALHA_AO_DELETAR_ARQUIVO"` 🟡
- **Risco:** Registro zumbi no banco aponta para arquivo inexistente no Storage

---

## EC-02: Arquivo já removido do Storage (DELETE duplo)

- **Cenário:** DELETE chamado duas vezes para o mesmo `fileId`
- **Comportamento (2ª chamada):** `SELECT path FROM task_files WHERE id = fileId` retorna `null` (já deletado) → HTTP 404 🟢
- **Resultado:** Idempotência garantida por fase 0

---

## EC-03: GET para task sem arquivos

- **Cenário:** Task existe, mas `task_files` não tem registros para ela
- **Comportamento:** `SELECT` retorna `[]` → `{ files: [] }` 🟢
- **Resultado:** Lista vazia sem erro

---

## EC-04: GET sem `taskId`

- **Comportamento:** `searchParams.get("taskId")` → `null` → `!taskId` → HTTP 400 🟢

---

## EC-05: Arquivo com path contendo diretório inexistente no Storage

- **Cenário:** `path = "fake-uuid/arq.pdf"` armazenado no banco, mas bucket `task-files/fake-uuid/` não existe
- **Comportamento:** `storage.remove(["fake-uuid/arq.pdf"])` pode retornar sucesso mesmo que o arquivo não exista (Supabase Storage ignora silenciosamente) 🟡
- **Resultado:** Registro deletado do banco, Storage sem efeito

---

## EC-06: Bucket `task-files` não existe

- **Cenário:** Bucket ausente no Supabase Storage
- **Comportamento:** `storage.remove()` retorna erro → HTTP 500 🟡
- **Resultado:** `ERRO: FALHA_AO_DELETAR_ARQUIVO` (bucket criado somente pelo módulo de upload)

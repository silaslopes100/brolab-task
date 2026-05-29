# Upload — Design Técnico

> `design.md` | Módulo: `upload` | doc_level: detalhado

---

## Interface

```
POST /api/upload
Content-Type: multipart/form-data

Fields:
  file    — arquivo (Blob/File)
  taskId  — UUID da tarefa

→ 200: { file: FileItem }
→ 400: { error }
→ 500: { error }
```

---

## Fluxo Principal

```
1. formData.get("file") + formData.get("taskId")
   → !file || !taskId? return 400 "ARQUIVO_E_TASK_ID_OBRIGATORIOS"

2. createAdminClient()
   → null? return 500

3. getBucket("task-files")
   → erro || null bucket? createBucket("task-files", { public: true })

4. Gera path:
   fileExt = file.name.split(".").pop()
   fileName = `${taskId}/${crypto.randomUUID()}.${fileExt}`

5. file.arrayBuffer() → new Uint8Array(buffer)
6. storage.from("task-files").upload(fileName, uint8array, { contentType: file.type, upsert: false })

7. storage.from("task-files").getPublicUrl(fileName)
   → publicUrl

8. INSERT INTO task_files { task_id, name: file.name, size: file.size, type: file.type, path: fileName }
   → .select().single()

9. return { file: { id, name, size, type, url: publicUrl, createdAt: created_at } }
```

---

## Considerações de Segurança

- 🔴 Sem validação de tipo MIME ou extensão do arquivo — qualquer conteúdo aceito
- 🔴 Sem limite de tamanho de arquivo no handler (depende do Supabase)
- 🔴 Sem autenticação — qualquer cliente pode fazer upload

---

## Dependências

- `lib/supabase/admin.ts` → `createAdminClient()` 🟢
- Tabela: `task_files` 🟢
- Bucket: `task-files` (auto-criado) 🟢

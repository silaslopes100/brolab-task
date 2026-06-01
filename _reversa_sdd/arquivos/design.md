# Arquivos — Design Técnico

> `design.md` | Módulo: `arquivos` | doc_level: detalhado
> Fonte: `app/api/files/route.ts`

---

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|-------------|
| GET | `/api/files?taskId=uuid` | `taskId` (query string) | `{ files: FileItem[] }` | 200, 400, 500 |
| DELETE | `/api/files?id=uuid` | `id` (query string) | `{ success: true }` | 200, 400, 404, 500 |

**Tipo `FileItem`:**
```ts
{
  id: string
  name: string
  size: number
  type: string          // MIME type
  url: string           // URL pública do Storage
  createdAt: string
}
```

---

## Fluxo Principal — GET

```
1. searchParams.get("taskId") → null? return 400
2. createAdminClient() → null? return 500
3. SELECT * FROM task_files WHERE task_id = taskId ORDER BY created_at ASC
4. Para cada file: storage.getPublicUrl(f.path) → url
5. return { files: formattedFiles }
```

---

## Fluxo Principal — DELETE (duas fases)

```
1. searchParams.get("id") → null? return 400
2. createAdminClient() → null? return 500

Fase 0 — Busca:
3. SELECT path FROM task_files WHERE id = fileId (.single())
   → fetchError || !fileRecord? return 404

Fase 1 — Storage:
4. storage.from(BUCKET_NAME).remove([fileRecord.path])
   → storageError? throw → return 500

Fase 2 — Banco:
5. DELETE FROM task_files WHERE id = fileId
   → dbError? throw → return 500

6. return { success: true }
```

---

## Buckets e Paths

- Bucket: `task-files` (constante `BUCKET_NAME`)
- Path: `{taskId}/{uuid}.{ext}` (gerado no upload, armazenado em `task_files.path`)

---

## Dependências

- `lib/supabase/admin.ts` → `createAdminClient()` 🟢
- Tabela: `task_files` 🟢
- Supabase Storage bucket `task-files` 🟢

---

## Riscos e Lacunas

- 🟡 **Inconsistência possível**: se `storage.remove()` falhar parcialmente (arquivo já removido), o banco ainda tem o registro → arquivo zumbi no DB
- 🟡 GET também retorna arquivos via GET /api/tasks — duas rotas para o mesmo dado
- 🔴 Sem autenticação — qualquer cliente pode deletar arquivos de qualquer task

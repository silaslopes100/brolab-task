# Listar Arquivos — Design Técnico

> `design.md` | Caso de uso: `arquivos/listar-arquivos`

---

## Sequência

```
GET ?taskId=uuid
1. Valida taskId (400 se ausente)
2. createAdminClient() (500 se falha)
3. SELECT * FROM task_files WHERE task_id = taskId ORDER BY created_at ASC
4. Para cada file: getPublicUrl(f.path) → url pública
5. Retorna { files: formattedFiles }
```

---

## Transformação de Campos

```ts
const formattedFile = {
  id: file.id,
  name: file.name,
  size: file.size,
  type: file.type,
  url: publicUrl,         // via storage.getPublicUrl(file.path).data.publicUrl
  createdAt: file.created_at,
}
```

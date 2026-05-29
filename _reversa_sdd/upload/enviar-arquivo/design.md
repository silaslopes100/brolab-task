# Enviar Arquivo — Design Técnico

> `design.md` | Caso de uso: `upload/enviar-arquivo`

---

## Fluxo Resumido

```
POST multipart
1. Valida file + taskId (400 se ausente)
2. Auto-cria bucket se necessário
3. fileName = `${taskId}/${randomUUID()}.${ext}`
4. Buffer: file.arrayBuffer() → Uint8Array
5. storage.upload(fileName, buffer, { contentType, upsert: false })
6. getPublicUrl(fileName) → publicUrl
7. INSERT task_files { task_id, name, size, type, path: fileName }
8. return { file: { id, name, size, type, url: publicUrl, createdAt } }
```

Ver `upload/design.md` para detalhes completos e análise de segurança.

# Upload — Contratos de API

> `contracts.md` | Módulo: `upload` | doc_level: detalhado

---

## POST /api/upload

**Requisição:**
```
POST /api/upload
Content-Type: multipart/form-data

file    = <arquivo binário>
taskId  = "uuid-da-tarefa"
```

**Resposta de sucesso (200):**
```json
{
  "file": {
    "id": "uuid",
    "name": "relatorio.pdf",
    "size": 102400,
    "type": "application/pdf",
    "url": "https://lmlouptvywbtswqlhnfb.supabase.co/storage/v1/object/public/task-files/taskId/uuid.pdf",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Erros:**
```json
// 400 — campos ausentes
{ "error": "ERRO: ARQUIVO_E_TASK_ID_OBRIGATORIOS" }

// 500 — sem service role key
{ "error": "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }

// 500 — falha no Storage ou banco
{ "error": "ERRO: FALHA_AO_ENVIAR_ARQUIVO" }
```

---

## Mapeamento DB ↔ API

| Campo na API | Campo no banco | Tabela |
|-------------|----------------|--------|
| `file.id` | `id` | `task_files` |
| `file.name` | `name` | `task_files` (= `file.name` do formData) |
| `file.size` | `size` | `task_files` (= `file.size` do formData) |
| `file.type` | `type` | `task_files` (= `file.type` do formData) |
| `file.url` | `getPublicUrl(path)` | via Storage |
| `file.createdAt` | `created_at` | `task_files` |

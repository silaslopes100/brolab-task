# Arquivos — Contratos de API

> `contracts.md` | Módulo: `arquivos` | doc_level: detalhado

---

## GET /api/files?taskId=uuid

**Sucesso (200):**
```json
{
  "files": [
    {
      "id": "uuid",
      "name": "documento.pdf",
      "size": 102400,
      "type": "application/pdf",
      "url": "https://lmlouptvywbtswqlhnfb.supabase.co/storage/v1/object/public/task-files/taskId/uuid.pdf",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Erros:**
```json
// 400 — sem taskId
{ "error": "ERRO: TASK_ID_OBRIGATORIO" }

// 500 — sem service role key
{ "error": "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }

// 500 — falha no banco
{ "error": "ERRO: FALHA_AO_BUSCAR_ARQUIVOS" }
```

---

## DELETE /api/files?id=uuid

**Sucesso (200):**
```json
{ "success": true }
```

**Erros:**
```json
// 400 — sem id
{ "error": "ERRO: ID_DO_ARQUIVO_OBRIGATORIO" }

// 404 — arquivo não encontrado
{ "error": "ERRO: ARQUIVO_NAO_ENCONTRADO" }

// 500 — falha no Storage ou banco
{ "error": "ERRO: FALHA_AO_DELETAR_ARQUIVO" }
```

---

## Mapeamento DB ↔ API

| Campo na API | Campo no banco | Tabela |
|-------------|----------------|--------|
| `id` | `id` | `task_files` |
| `name` | `name` | `task_files` |
| `size` | `size` | `task_files` |
| `type` | `type` | `task_files` |
| `url` | `getPublicUrl(path)` | via Storage |
| `createdAt` | `created_at` | `task_files` |

# Tarefas — Contratos de API

> `contracts.md` | Módulo: `tarefas` | doc_level: detalhado
> Fonte: `app/api/tasks/route.ts`

---

## GET /api/tasks

**Requisição:**
```
GET /api/tasks
(sem parâmetros)
```

**Resposta de sucesso (200):**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "columnId": "BACKLOG",
      "position": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "assignees": ["username1"],
      "labels": [
        { "id": "URGENTE", "name": "URGENTE", "color": "#EF4444" }
      ],
      "comments": [
        {
          "id": "uuid",
          "content": "string",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "authorId": "username",
          "authorName": "username",
          "mentions": []
        }
      ],
      "files": [
        {
          "id": "uuid",
          "name": "arquivo.pdf",
          "size": 12345,
          "type": "application/pdf",
          "url": "https://...supabase.co/storage/v1/object/public/task-files/...",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

**Resposta de erro (500):**
```json
{ "error": "ERRO: FALHA_AO_BUSCAR_TAREFAS" }
```

---

## POST /api/tasks

**Requisição:**
```
POST /api/tasks
Content-Type: application/json

{
  "title": "string",           // obrigatório
  "description": "string",     // opcional, default ""
  "columnId": "BACKLOG",       // opcional, default "BACKLOG"
  "position": 0,               // opcional, default 0
  "assignees": ["username"],   // opcional, default []
  "labels": [{ "name": "URGENTE" }]  // opcional, default []
}
```

**Resposta de sucesso (200):**
```json
{
  "task": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "columnId": "BACKLOG",
    "position": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "assignees": [],
    "labels": [],
    "comments": [],
    "files": []
  }
}
```

**Respostas de erro:**
```json
// 500 — sem service role key
{ "error": "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }

// 500 — falha no DB
{ "error": "ERRO: FALHA_AO_CRIAR_TAREFA" }
```

---

## PATCH /api/tasks

**Requisição:**
```
PATCH /api/tasks
Content-Type: application/json

{
  "id": "uuid",                // obrigatório
  "title"?: "string",
  "description"?: "string",
  "columnId"?: "FAZENDO",
  "position"?: 2,
  "assignees"?: ["user1"],
  "labels"?: [{ "name": "BUG" }]
}
```

> Apenas campos presentes no body são atualizados. `id` não é atualizado.

**Resposta de sucesso (200):**
```json
{ "success": true }
```

**Respostas de erro:**
```json
// 500
{ "error": "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }
{ "error": "ERRO: FALHA_AO_ATUALIZAR_TAREFA" }
```

---

## DELETE /api/tasks

**Requisição:**
```
DELETE /api/tasks?id=uuid
```

**Resposta de sucesso (200):**
```json
{ "success": true }
```

**Respostas de erro:**
```json
// 400 — id ausente
{ "error": "ID obrigatório" }

// 500
{ "error": "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }
{ "error": "ERRO: FALHA_AO_DELETAR_TAREFA" }
```

---

## Mapeamento DB ↔ API

| Campo na API | Campo no banco | Tabela |
|-------------|----------------|--------|
| `columnId` | `status` | `tasks` |
| `labels[].id` | `labels[i]` (TEXT) | `tasks` |
| `labels[].name` | `labels[i]` (TEXT) | `tasks` |
| `labels[].color` | — (computado) | — |
| `comments[].authorId` | `author_username` | `task_comments` |
| `comments[].authorName` | `author_username` | `task_comments` |
| `files[].url` | — (gerado via `getPublicUrl`) | Supabase Storage |

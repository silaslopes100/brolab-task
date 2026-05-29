# Comentários — Contratos de API

> `contracts.md` | Módulo: `comentarios` | doc_level: detalhado

---

## POST /api/comments

**Requisição:**
```
POST /api/comments
Content-Type: application/json

{
  "taskId": "uuid",
  "authorUsername": "alice",
  "content": "olá @bob revise isso"
}
```

**Resposta de sucesso (200):**
```json
{
  "comment": {
    "id": "uuid",
    "content": "olá @bob revise isso",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "authorId": "alice",
    "authorName": "alice",
    "mentions": []
  }
}
```

**Efeito colateral:** Se `@bob` existe em `team_members`, é inserida em `notifications`:
```json
{
  "user_id": "<bob_id>",
  "type": "mention",
  "message": "alice mencionou você na tarefa \"Título da Tarefa\"",
  "task_id": "uuid",
  "task_title": "Título da Tarefa",
  "from_user": "alice",
  "read": false
}
```

**Respostas de erro:**
```json
// 500 — sem service role key
{ "error": "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }

// 500 — falha no banco
{ "error": "ERRO: FALHA_AO_CRIAR_COMENTÁRIO" }
```

---

## Mapeamento DB ↔ API

| Campo na API | Campo no banco | Tabela |
|-------------|----------------|--------|
| `taskId` | `task_id` | `task_comments` |
| `authorUsername` | `author_username` | `task_comments` |
| `comment.authorId` | `author_username` | `task_comments` |
| `comment.authorName` | `author_username` | `task_comments` (mesmo campo) |
| `comment.mentions` | — | (sempre `[]`) |

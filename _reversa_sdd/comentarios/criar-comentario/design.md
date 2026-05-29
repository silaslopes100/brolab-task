# Criar Comentário — Design Técnico

> `design.md` | Caso de uso: `comentarios/criar-comentario`

---

## Interface

```
POST /api/comments
Body: { taskId, authorUsername, content }
→ 200: { comment }
→ 500: { error }
```

---

## Sequência Resumida

```
regex → busca users → INSERT notifs → INSERT comentário → retorna
```

Ver `comentarios/design.md` para sequência detalhada.

---

## Campos da tabela `notifications` inseridos

| Campo | Valor |
|-------|-------|
| `user_id` | ID do membro mencionado |
| `type` | `"mention"` |
| `message` | `"{autor} mencionou você na tarefa "{título}""` |
| `task_id` | `taskId` |
| `task_title` | título buscado de `tasks` |
| `from_user` | `authorUsername` |
| `read` | `false` |

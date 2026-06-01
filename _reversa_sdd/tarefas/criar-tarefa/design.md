# Criar Tarefa — Design Técnico

> `design.md` | Caso de uso: `tarefas/criar-tarefa`

---

## Interface

```
POST /api/tasks
Body: { title, description?, columnId?, position?, assignees?, labels?: [{name}][] }
→ 200: { task: Task }
→ 500: { error: string }
```

---

## Sequência de Execução

```
1. request.json() → desestrutura campos
2. createAdminClient() → null? return 500
3. INSERT INTO tasks {
     title,
     description: description || "",
     status: columnId || "BACKLOG",
     position: position || 0,
     assignees: assignees || [],
     labels: labels ? labels.map(l => l.name) : []
   }
4. SELECT (via .single())
5. Formata resposta com getLabelColor(), comments: [], files: []
6. return { task }
```

---

## Mapeamento de Campos

| Input | Coluna no banco | Default |
|-------|----------------|---------|
| `title` | `tasks.title` | (obrigatório) |
| `description` | `tasks.description` | `""` |
| `columnId` | `tasks.status` | `"BACKLOG"` |
| `position` | `tasks.position` | `0` |
| `assignees` | `tasks.assignees` | `[]` |
| `labels[].name` | `tasks.labels[]` (TEXT) | `[]` |

---

## Notas

- 🔴 Sem validação de `title` — INSERT com null dispara erro do banco
- 🟢 `labels` retornam com `color` calculado via `getLabelColor` na resposta

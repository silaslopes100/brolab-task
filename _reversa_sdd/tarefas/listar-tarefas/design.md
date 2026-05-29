# Listar Tarefas — Design Técnico

> `design.md` | Caso de uso: `tarefas/listar-tarefas`

---

## Interface

```
GET /api/tasks
→ 200: { tasks: Task[] }
→ 500: { error: "ERRO: FALHA_AO_BUSCAR_TAREFAS" }
```

---

## Sequência de Execução

```
1. createAdminClient() ?? createClient()   ← fallback SSR
2. SELECT * FROM tasks ORDER BY position ASC
3. SELECT * FROM task_comments ORDER BY created_at ASC
4. Reduz comments[] → { [task_id]: Comment[] }
5. SELECT * FROM task_files ORDER BY created_at ASC
6. Reduz task_files[] → { [task_id]: File[] }
7. Para cada task:
   a. Para cada file: storage.getPublicUrl(path) → url
   b. Mapeia labels TEXT[] → { id: name, name, color: getLabelColor(name) }[]
   c. Mapeia comments → { id, content, createdAt, authorId, authorName, mentions: [] }[]
   d. Mapeia task: { ...task, columnId: task.status, ... }
8. return { tasks: formattedTasks }
```

---

## Agrupamento em Memória (detalhe)

```ts
const commentsByTaskId: Record<string, Comment[]> = {}
for (const c of comments) {
  if (!commentsByTaskId[c.task_id]) commentsByTaskId[c.task_id] = []
  commentsByTaskId[c.task_id].push(c)
}
// mesmo padrão para task_files
```

> 🟢 O(n) no número total de comments/files — eficiente para volumes moderados.

---

## Notas de Implementação

- `getPublicUrl()` é **síncrono** — não é uma Promise 🟢
- Os 3 SELECTs são sequenciais (não paralelos com `Promise.all`) 🟡
- Sem paginação: risco de payload grande com muitas tasks 🔴

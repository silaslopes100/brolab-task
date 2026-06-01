# Atualizar Tarefa — Design Técnico

> `design.md` | Caso de uso: `tarefas/atualizar-tarefa`

---

## Interface

```
PATCH /api/tasks
Body: { id, title?, description?, columnId?, position?, assignees?, labels?: [{name}][] }
→ 200: { success: true }
→ 500: { error: string }
```

---

## Sequência de Execução

```
1. request.json() → { id, title, description, columnId, position, assignees, labels }
2. createAdminClient() → null? return 500
3. Montar updates (apenas campos !== undefined):
   title      → updates.title = title
   description→ updates.description = description
   columnId   → updates.status = columnId
   position   → updates.position = position
   assignees  → updates.assignees = assignees
   labels     → updates.labels = labels.map(l => l.name)
4. if (Object.keys(updates).length > 0):
     UPDATE tasks SET ...updates WHERE id = id
5. return { success: true }
```

---

## Construção do Objeto Parcial (detalhe)

```ts
const updates: Record<string, unknown> = {}
if (title !== undefined) updates.title = title
if (description !== undefined) updates.description = description
if (columnId !== undefined) updates.status = columnId
if (position !== undefined) updates.position = position
if (assignees !== undefined) updates.assignees = assignees
if (labels !== undefined) updates.labels = labels.map((l: { name: string }) => l.name)
```

> 🟢 Campos `null` explícitos são permitidos — `if (x !== undefined)` não bloqueia null.

---

## Notas

- 🟡 Sem retorno da task atualizada — cliente precisa re-fetch ou fazer optimistic update
- 🟡 ID inexistente retorna success sem aviso — considerar HTTP 404 como melhoria

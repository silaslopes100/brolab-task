# Deletar Tarefa — Design Técnico

> `design.md` | Caso de uso: `tarefas/deletar-tarefa`

---

## Interface

```
DELETE /api/tasks?id=uuid
→ 200: { success: true }
→ 400: { error: "ID obrigatório" }
→ 500: { error: string }
```

---

## Sequência de Execução

```
1. const { searchParams } = new URL(request.url)
2. const id = searchParams.get("id")
3. if (!id) → return 400 { error: "ID obrigatório" }
4. createAdminClient() → null? return 500
5. DELETE FROM tasks WHERE id = id
   └─ CASCADE → DELETE FROM task_files WHERE task_id = id
6. if (error) throw
7. return { success: true }
```

---

## Notas

- 🟢 Usa `new URL(request.url)` para parsing seguro da query string
- 🟡 `task_comments` não têm `ON DELETE CASCADE` explícito — verificar migration
- 🟡 Sem HTTP 404 — DELETE de ID inexistente retorna 200

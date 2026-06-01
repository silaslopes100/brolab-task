# Tarefas — Fluxos

> `flows.md` | Módulo: `tarefas` | doc_level: detalhado

---

## Fluxo 1 — Carregamento Inicial do Board

```
BroLabTask.fetchData()
  │
  ├─► GET /api/tasks
  │     ├─► SELECT * FROM tasks ORDER BY position ASC
  │     ├─► SELECT * FROM task_comments ORDER BY created_at ASC
  │     ├─► SELECT * FROM task_files ORDER BY created_at ASC
  │     ├─► Agrupa comments/files por task_id em memória
  │     ├─► Para cada file: getPublicUrl(path) → url
  │     └─► Retorna { tasks: Task[] }
  │
  └─► setTasks(data.tasks)
      SPA distribui tasks por columnId para cada KanbanColumn
```

---

## Fluxo 2 — Criar Tarefa

```
Usuário clica "+" em coluna X
  │
  ├─► Abre modal de criação
  ├─► Preenche título, descrição, assignees, labels
  │
  └─► handleCreateTask(input)
        │
        └─► POST /api/tasks { title, columnId: "X", position, ... }
              │
              ├─► INSERT INTO tasks (...)
              └─► Retorna { task: Task }
                    │
                    └─► setTasks(prev => [...prev, newTask])
```

---

## Fluxo 3 — Mover Tarefa Entre Colunas (Drag-and-drop)

```
Usuário arrasta task da coluna A para coluna B
  │
  └─► handleMoveTask(taskId, newColumnId, newPosition)
        │
        ├─► Atualiza estado local imediatamente (optimistic update) 🟡
        │
        └─► PATCH /api/tasks { id, columnId: "B", position: newPosition }
              │
              ├─► UPDATE tasks SET status="B", position=newPosition WHERE id=taskId
              └─► Retorna { success: true }
```

---

## Fluxo 4 — Atualizar Tarefa

```
Usuário edita tarefa aberta
  │
  └─► handleUpdateTask(id, updates)
        │
        └─► PATCH /api/tasks { id, ...updates }
              │
              ├─► Monta objeto updates com campos presentes
              └─► UPDATE tasks SET ... WHERE id = id
```

---

## Fluxo 5 — Deletar Tarefa

```
Usuário clica "Deletar" na tarefa
  │
  └─► handleDeleteTask(taskId)
        │
        └─► DELETE /api/tasks?id=taskId
              │
              ├─► DELETE FROM tasks WHERE id = taskId
              │     └─► CASCADE → DELETE FROM task_files WHERE task_id = taskId
              └─► Retorna { success: true }
                    │
                    └─► setTasks(prev => prev.filter(t => t.id !== taskId))
```

---

## Diagrama de Estado da Tarefa

```
              ┌──────────────────────────────────────┐
              │                                      │
         ┌────▼─────┐   mover   ┌──────────┐  mover  ┌──────────────┐
POST ──► │ BACKLOG  │ ────────► │ FAZENDO  │ ──────► │ ALTERAÇÕES   │
         └────┬─────┘           └──────────┘         └──────────────┘
              │                                               │
              │              PATCH (status)                   │
              │                                               ▼
              │                                       ┌──────────────┐
              │                                       │  APROVADO    │
              │                                       └──────┬───────┘
              │                                              │
              ▼                                              ▼
         ┌──────────┐   DELETE                       ┌──────────────┐
         │ FEITO    │ ◄──────────────────────────────│  (qualquer)  │
         └──────────┘
```

> 🟡 A sequência exata de colunas é hardcoded em `GET /api/columns`. Qualquer `status` texto é válido no banco.

---

## Notas

- 🟢 Todas as mutações (POST/PATCH/DELETE) usam `createAdminClient()` — sem RLS
- 🟢 O GET usa fallback `createAdminClient() ?? createClient()` — funciona sem service role
- 🟡 Não há rollback automático se o PATCH falhar após optimistic update no cliente

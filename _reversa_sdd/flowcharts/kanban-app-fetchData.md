# Flowchart — Função `kanban-app fetchData` (detalhado)

> Função: `fetchData` — `app/page.tsx`
>
> Callback principal de carregamento de dados. Dispara 3 fetches em paralelo e monta o estado.

```mermaid
flowchart TD
    START([fetchData chamado]) --> P1[Promise.all: 3 fetches paralelos]
    P1 --> F1[fetch /api/columns]
    P1 --> F2[fetch /api/tasks]
    P1 --> F3[fetch /api/users]
    F1 & F2 & F3 --> P2[await todas as respostas]
    P2 --> J1[columnsRes.json .catch {} ]
    P2 --> J2[tasksRes.json .catch {}]
    P2 --> J3[usersRes.json .catch {}]
    J1 & J2 & J3 --> P3[await todos os jsons]

    P3 --> V1[columnsList = columnsData.columns ou array vazio]
    P3 --> V2[tasksList = tasksData.tasks ou array vazio]
    P3 --> V3[usersList = usersData.users ou array vazio]

    V1 --> M1[Para cada column em columnsList]
    V2 --> M1
    M1 --> M2[tasks = tasksList.filter t.columnId === col.id]
    M2 --> M3[tasks.sort por position ASC]
    M3 --> M4[columnsWithTasks = {...col, tasks}]
    M4 --> M1
    M1 --> END1[setColumns - columnsWithTasks]
    V3 --> END2[setTeam - usersList]
    END1 & END2 --> DONE([Estado React atualizado])
```

## Notas de resilência

| Ponto | Comportamento | Nota |
|-------|--------------|------|
| Fetch falha (network) | `.catch(() => ({}))` → array vazio | 🟢 Graceful — UI renderiza vazia |
| API retorna não-array | Fallback `Array.isArray` check | 🟢 Seguro |
| tasks sem coluna | `filter` retorna vazio | 🟢 Task ignorada silenciosamente |
| Erro geral | `catch → console.error` | 🟡 Sem feedback visual ao usuário |

# Flowchart — Função `tasks GET aggregation` (detalhado)

> Função: `GET /api/tasks` — `app/api/tasks/route.ts`
>
> Fluxo detalhado: 3 queries + agregação em memória + projeção de tipos.

```mermaid
flowchart TD
    START([GET /api/tasks]) --> C1[serverClient = createClient]
    C1 --> C2{serverClient OK?}
    C2 -- Não --> E1([500 erro de client])

    C2 -- Sim --> Q1[Query 1: SELECT id,title,description,status,position,assignees,labels,created_at FROM tasks ORDER BY position ASC]
    Q1 --> Q1E{Erro?}
    Q1E -- Sim --> E2([500 FALHA_AO_BUSCAR_TAREFAS])
    Q1E -- Não --> Q2[Query 2: SELECT id,task_id,author_id,author_name,content,created_at FROM task_comments]
    Q2 --> Q3[Query 3: SELECT id,task_id,name,size,type,path,created_at FROM task_files]

    Q2 --> M1[commentsMap = Record por task_id - agrupa em memória]
    Q3 --> M2[filesMap = Record por task_id - agrupa em memória]

    M1 --> LOOP[Para cada task em tasks]
    M2 --> LOOP
    Q1 --> LOOP

    LOOP --> L1[Mapeia status → columnId]
    L1 --> L2[Para cada label string em task.labels]
    L2 --> L3[getLabelColor - hash determinístico → hex]
    L3 --> L4[Projeta Label object - id=name, name, color]
    L4 --> L5[Agrega comments do commentsMap por task.id]
    L5 --> L6[Agrega files do filesMap por task.id]
    L6 --> L7[Para cada file: storage.getPublicUrl - path]
    L7 --> L8[Monta Task object completo]
    L8 --> LOOP
    LOOP --> OK([200 OK - tasks array completo])
```

## Algoritmo getLabelColor

```mermaid
flowchart LR
    IN[label.name string] --> H1[hash = 0]
    H1 --> H2[Para cada char: hash = charCode + hash * 32 - hash]
    H2 --> H3[idx = Math.abs hash % 7]
    H3 --> OUT[LABEL_COLORS idx]
    OUT --> COLORS["#FFFFFF | #6B7280 | #84CC16 | #A3E635 | #F97316 | #EF4444 | #22C55E"]
```

## Performance e complexidade

| Operação | Complexidade | Nota |
|----------|-------------|------|
| Queries ao banco | O(3) — fixo | Sem joins, 3 SELECT full-scan |
| Agrupamento em memória | O(n + m + p) | n=tasks, m=comments, p=files |
| Projeção de labels | O(tasks × labels) | Geralmente pequeno |
| getPublicUrl | O(files) | Chamada local ao SDK, sem HTTP |

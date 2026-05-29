# Flowchart — Módulo `tasks`

> `app/api/tasks/route.ts`

## GET /api/tasks — Busca com agregação

```mermaid
flowchart TD
    A[GET /api/tasks] --> B{serverClient disponível?}
    B -- Não --> ERR1[500 erro de client]
    B -- Sim --> C[Query 1: SELECT * FROM tasks ORDER BY position ASC]
    C --> D[Query 2: SELECT * FROM task_comments]
    D --> E[Query 3: SELECT * FROM task_files]
    E --> F[Agrupa comentários por task_id em Record map]
    F --> G[Agrupa arquivos por task_id em Record map]
    G --> H{Para cada task}
    H --> I[Mapeia: status → columnId]
    I --> J[Projeta labels TEXT[] → Label objects com cor via getLabelColor]
    J --> K[Agrega comments e files pelo id da task]
    K --> L[Gera publicUrl para cada arquivo via storage.getPublicUrl]
    L --> M[200 OK - tasks array]
```

## POST /api/tasks — Criação

```mermaid
flowchart TD
    A[POST /api/tasks] --> B{adminClient disponível?}
    B -- Não --> ERR1[500 erro de admin]
    B -- Sim --> C[Extrai: title, description, columnId, position, assignees, labels]
    C --> D[Mapeia labels → array de names apenas]
    D --> E[INSERT INTO tasks com status = columnId]
    E --> F{Erro no insert?}
    F -- Sim --> ERR2[500 FALHA_AO_CRIAR_TAREFA]
    F -- Não --> G[Projeta task criada com labels como Label objects]
    G --> H[200 OK - task com comments e files vazios]
```

## PATCH /api/tasks — Atualização parcial

```mermaid
flowchart TD
    A[PATCH /api/tasks] --> B[Extrai id e campos opcionais do body]
    B --> C[Filtra: monta updates apenas com campos não-undefined]
    C --> D{updates tem algum campo?}
    D -- Não --> E[200 OK - sem fazer nada]
    D -- Sim --> F{adminClient disponível?}
    F -- Não --> ERR1[500 erro de admin]
    F -- Sim --> G[UPDATE tasks SET ...updates WHERE id = id]
    G --> H{Erro?}
    H -- Sim --> ERR2[500 FALHA_AO_ATUALIZAR_TAREFA]
    H -- Não --> I[200 OK - success: true]
```

## DELETE /api/tasks — Exclusão

```mermaid
flowchart TD
    A[DELETE /api/tasks?id=] --> B{id presente?}
    B -- Não --> ERR1[400 ID obrigatório]
    B -- Sim --> C{adminClient disponível?}
    C -- Não --> ERR2[500 erro de admin]
    C -- Sim --> D[DELETE FROM tasks WHERE id = id]
    D --> E{Erro?}
    E -- Sim --> ERR3[500 FALHA_AO_DELETAR_TAREFA]
    E -- Não --> F[200 OK - success: true]
    F --> G[CASCADE: task_files deletados automaticamente]
```

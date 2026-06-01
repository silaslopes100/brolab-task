# Flowchart — Módulo `kanban-app`

> `app/page.tsx` — SPA monolítica (~1960 LOC)

## Fluxo de inicialização

```mermaid
flowchart TD
    A[BroLabTask montado] --> B[isLoading = true - msg INITIALIZING_SYSTEM]
    B --> C[useEffect: init]
    C --> D[msg CONNECTING_TO_SUPABASE]
    D --> E[fetchData - paralelo: colunas + tasks + users]
    E --> F[msg SYSTEM_READY]
    F --> G[isLoading = false]
    G --> H{currentUser é null?}
    H -- Sim --> I[Renderiza LoginScreen]
    H -- Não --> J[Renderiza KanbanBoard]
    I --> K[usuário faz login]
    K --> L[handleLogin → POST /api/auth/login]
    L --> M{Login OK?}
    M -- Não --> N[Exibe erro no LoginScreen]
    M -- Sim --> O[setCurrentUser - trigger useEffect de notificações]
    O --> J
```

## Hierarquia de componentes

```mermaid
flowchart TD
    BroLabTask --> LoadingScreen
    BroLabTask --> LoginScreen
    BroLabTask --> KanbanBoard
    KanbanBoard --> Header
    Header --> NotificationBell
    KanbanBoard --> NotificationsModal
    KanbanBoard --> TeamAdminModal
    KanbanBoard --> ProfileEditModal
    KanbanBoard --> TaskEditModal
    TaskEditModal --> LabelManager
    LabelManager --> LabelBadge
    TaskEditModal --> MentionInput
    KanbanBoard --> KanbanColumn
    KanbanColumn --> TaskCard
    TaskCard --> LabelBadge
    KanbanColumn --> NewTaskForm
    KanbanBoard --> NewColumnForm
```

## State global em BroLabTask

```mermaid
flowchart LR
    S1[currentUser: TeamMember or null]
    S2[team: TeamMember array]
    S3[columns: Column array com tasks aninhadas]
    S4[notifications: Notification array]
    S5[isLoading: boolean]
    S6[loadingMessage: string]
```

## Ciclo de atualização de dados

```mermaid
flowchart TD
    A[Usuário faz ação - criar task, mover, etc.] --> B[Handler async chamado]
    B --> C[fetch para API Route correspondente]
    C --> D{Sucesso?}
    D -- Não --> E[console.error silencioso]
    D -- Sim --> F[await fetchData - recarrega tudo]
    F --> G[setColumns + setTeam com dados frescos]
    G --> H[React re-renderiza UI]
```

## Fluxo de movimento de task

```mermaid
flowchart TD
    A{Tipo de movimento?}
    A -- Horizontal esq/dir --> B[handleMoveTask via KanbanBoard]
    B --> C[Determina coluna destino pelo índice]
    C --> D[PATCH /api/tasks - columnId = coluna destino, position = last]

    A -- Vertical cima/baixo --> E[handleMoveTaskVertical via KanbanBoard]
    E --> F[Determina nova position pelo índice na coluna]
    F --> G[PATCH /api/tasks - mesma coluna, position = nova]

    D --> H[await fetchData]
    G --> H
    H --> I[UI atualizada]
```

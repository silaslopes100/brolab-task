# Kanban App — Design Técnico

> `design.md` | Módulo: `kanban-app` | doc_level: detalhado

---

## Estrutura de Componentes

```
BroLabTask (Root, "use client")
├── LoadingScreen              ← isLoading = true
├── LoginScreen                ← !currentUser
└── KanbanBoard                ← currentUser definido
    ├── Header
    │   └── NotificationBell
    ├── NotificationsModal     ← showNotifications
    ├── TeamAdminModal         ← showTeamModal
    ├── ProfileEditModal       ← showProfileEdit
    ├── TaskEditModal          ← editingTask !== null
    └── [KanbanColumn, ...]
        ├── TaskCard           ← task em cada coluna
        ├── NewTaskForm        ← showNewTaskForm
        └── [botão + NEW COLUMN]
            └── NewColumnForm  ← showNewColumnForm
```

---

## Fluxo de Autenticação

```
LoginScreen → onLogin(email, password)
→ POST /api/auth/login
  → { user: TeamMember } → setCurrentUser()
  → erro → throw Error → LoginScreen exibe mensagem
```

Logout:
```
handleLogout() → setCurrentUser(null) → setNotifications([])
```

---

## Composição da Coluna

```
fetchData() → GET /api/columns → GET /api/tasks (paralelo)
→ columnsWithTasks = columns.map(col => ({
    ...col,
    tasks: tasks.filter(t => t.columnId === col.id)
                .sort((a,b) => a.position - b.position)
  }))
→ setColumns(columnsWithTasks)
```

---

## MentionInput — Algoritmo de Autocomplete

```
1. onChange → detecta último "@" na string
2. Se "@" na última posição → showMentions = true, mentionFilter = ""
3. Se "@" seguido de texto sem espaço → showMentions = true, mentionFilter = texto
4. Se espaço após "@text" → showMentions = false
5. Click em membro → substitui "@filter" por "@username " no texto
```

---

## LabelBadge — Contraste de Cor

```ts
const isDark = ["#FFFFFF","#A3E635","#84CC16"].includes(label.color)
color = isDark ? "#000000" : "#FFFFFF"
```

---

## Realtime — Canal de Notificações

```ts
// Criado em useEffect com dependência [currentUser]
const channel = supabase
  .channel(`notifications_user_${currentUser.id}`)
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'notifications',
    filter: `user_id=eq.${currentUser.id}`,
  }, (payload) => {
    // mapeia snake_case do DB para camelCase do tipo Notification
    setNotifications(prev => [mapped, ...prev])
  })
  .subscribe()

// Cleanup: supabase.removeChannel(channel)
```

---

## Paleta do Design System

| Token | Valor | Uso |
|-------|-------|-----|
| Background | `#000000` | Toda a app |
| Primary | `#00FF66` | Textos, borders, botões ativos |
| Surface | `#1A1A1A` | Cards, inputs, areas de conteúdo |
| Border | `#262626` | Borders inativos |
| Danger | `#FF3333` | Botões DELETE, erros, badge admin |
| Fonte | JetBrains Mono | Todo o app |

---

## Prop Drilling Map

```
BroLabTask
 ↓ (onLogin, isLoading) → LoginScreen
 ↓ (currentUser, notifications, onLogout, ...) → KanbanBoard
    ↓ (notifications, onOpen) → NotificationBell
    ↓ (notifications, ...) → NotificationsModal
    ↓ (team, currentUser, ...) → TeamAdminModal
    ↓ (user, onSave, ...) → ProfileEditModal
    ↓ (task, team, currentUser, ...) → TaskEditModal
    ↓ (column, ..., onAddTask, onMoveTask, ...) → KanbanColumn
       ↓ (task, ..., onEdit, onMove, ...) → TaskCard
       ↓ (team, onSubmit, ...) → NewTaskForm
```

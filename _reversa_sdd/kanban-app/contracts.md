# Kanban App — Contratos de Interface

> `contracts.md` | Módulo: `kanban-app`

---

## Props: BroLabTask → KanbanBoard

```ts
interface KanbanBoardProps {
  currentUser: TeamMember
  team: TeamMember[]
  columns: Column[]
  notifications: Notification[]
  onLogout: () => void
  onUpdateUser: (updates: Partial<TeamMember> & { password?: string }) => void
  onAddTeamMember: (member: { name; username; role; email; password; isAdmin }) => void
  onDeleteTeamMember: (id: string) => void
  onAddColumn: (name: string) => void
  onDeleteColumn: (id: string) => void
  onAddTask: (columnId: string, task: { title; description; assignees }) => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
  onMoveTask: (taskId, fromColumnId, toColumnId, newPosition?) => void
  onAddComment: (taskId, content, mentions) => void
  onMarkNotificationRead: (id: string) => void
  onClearAllNotifications: () => void
  refreshData: () => void
}
```

---

## Props: KanbanBoard → KanbanColumn

```ts
interface KanbanColumnProps {
  column: Column
  columnIndex: number
  totalColumns: number
  team: TeamMember[]
  onAddTask: (task) => void
  onMoveTask: (taskId, direction: "left"|"right") => void
  onMoveTaskVertical: (taskId, direction: "up"|"down") => void
  onDeleteTask: (taskId: string) => void
  onDeleteColumn: () => void
  onEditTask: (task: Task) => void
  isDefault: boolean
}
```

---

## Props: KanbanColumn → TaskCard

```ts
interface TaskCardProps {
  task: Task
  columnIndex: number
  taskIndex: number
  totalColumns: number
  totalTasks: number
  onMove: (direction: "left"|"right") => void
  onMoveVertical: (direction: "up"|"down") => void
  onDelete: () => void
  onEdit: () => void
}
```

---

## Props: TaskEditModal

```ts
interface TaskEditModalProps {
  task: Task
  team: TeamMember[]
  currentUser: TeamMember
  onClose: () => void
  onSave: (updates: Partial<Task>) => void
  onAddComment: (content: string, mentions: string[]) => void
}
```

---

## Constantes Públicas

```ts
const LABEL_COLORS = [
  { name: "Branco", value: "#FFFFFF" },
  { name: "Cinza", value: "#6B7280" },
  { name: "Verde Escuro", value: "#84CC16" },
  { name: "Verde Claro", value: "#A3E635" },
  { name: "Laranja", value: "#F97316" },
  { name: "Vermelho", value: "#EF4444" },
  { name: "Verde", value: "#22C55E" },
]

const DEFAULT_COLUMN_NAMES = ["BACKLOG","FAZENDO","ALTERAÇÕES","APROVADO","FEITO"]
```

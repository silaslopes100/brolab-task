"use client"

import { useState } from "react"

// Types
interface Task {
  id: string
  title: string
  description: string
  assignee: string
  createdAt: string
}

interface Column {
  id: string
  title: string
  tasks: Task[]
}

interface TeamMember {
  id: string
  name: string
  role: string
  email: string
}

// Initial Data
const initialTeamMembers: TeamMember[] = [
  { id: "1", name: "ADMIN_ROOT", role: "SYSTEM_ADMIN", email: "admin@bro.labs" },
  { id: "2", name: "DEV_01", role: "DEVELOPER", email: "dev01@bro.labs" },
  { id: "3", name: "DEV_02", role: "DEVELOPER", email: "dev02@bro.labs" },
  { id: "4", name: "QA_LEAD", role: "QA_ENGINEER", email: "qa@bro.labs" },
]

const initialColumns: Column[] = [
  { id: "backlog", title: "BACKLOG", tasks: [] },
  { id: "fazendo", title: "FAZENDO", tasks: [] },
  { id: "alteracoes", title: "ALTERAÇÕES", tasks: [] },
  { id: "aprovado", title: "APROVADO", tasks: [] },
  { id: "feito", title: "FEITO", tasks: [] },
]

// Login Screen Component
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    setIsLoading(true)
    setTimeout(() => {
      onLogin()
    }, 800)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="border-2 border-[#00FF66] p-8 md:p-12 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-[#00FF66] text-2xl md:text-3xl font-bold mb-2">
            BRO.LABS
          </div>
          <div className="text-[#00FF66]/70 text-sm">
            {"// AUTH_REQUIRED"}
          </div>
        </div>

        <div className="border border-[#262626] p-4 mb-6">
          <div className="text-[#00FF66]/50 text-xs mb-2">
            {">"} SYSTEM_STATUS: SECURE
          </div>
          <div className="text-[#00FF66]/50 text-xs mb-2">
            {">"} CONNECTION: ENCRYPTED
          </div>
          <div className="text-[#00FF66]/50 text-xs">
            {">"} AWAITING_CREDENTIALS...
            <span className="animate-pulse">_</span>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full h-14 border-2 border-[#00FF66] bg-black text-[#00FF66] font-mono text-sm hover:bg-[#00FF66] hover:text-black transition-colors active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-pulse">{">"}</span>
              AUTHENTICATING...
            </span>
          ) : (
            "[ LOGIN WITH GOOGLE ]"
          )}
        </button>

        <div className="mt-6 text-center text-[#00FF66]/30 text-xs">
          BROLABTASK_CLI_v1.0 © BRO.LABS
        </div>
      </div>
    </div>
  )
}

// Header Component
function Header({
  onLogout,
  onToggleTeam,
  showTeam,
}: {
  onLogout: () => void
  onToggleTeam: () => void
  showTeam: boolean
}) {
  return (
    <header className="border-b-2 border-[#00FF66] bg-black sticky top-0 z-50">
      <div className="px-3 py-3 md:px-6 md:py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-[#00FF66]">
            <span className="text-lg md:text-xl font-bold">BRO.LABS</span>
            <span className="text-[#00FF66]/50 text-xs md:text-sm">
              {"// BROLABTASK_CLI_v1.0"}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <div className="border border-[#262626] px-3 py-2 text-xs">
              <span className="text-[#00FF66]/50">USER:</span>
              <span className="text-white ml-2">ADMIN_ROOT</span>
            </div>

            <button
              onClick={onToggleTeam}
              className={`h-10 px-3 border text-xs transition-colors ${
                showTeam
                  ? "border-[#00FF66] bg-[#00FF66] text-black"
                  : "border-[#00FF66] bg-black text-[#00FF66] hover:bg-[#262626]"
              }`}
            >
              [ VIEW_TEAM ]
            </button>

            <button
              onClick={onLogout}
              className="h-10 px-3 border border-[#FF3333] text-[#FF3333] text-xs hover:bg-[#FF3333] hover:text-black transition-colors"
            >
              [ EXIT_SESSION ]
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

// Team Modal Component
function TeamModal({
  team,
  onClose,
  onAddMember,
}: {
  team: TeamMember[]
  onClose: () => void
  onAddMember: (member: TeamMember) => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newRole, setNewRole] = useState("")
  const [newEmail, setNewEmail] = useState("")

  const handleSubmit = () => {
    if (newName.trim() && newRole.trim() && newEmail.trim()) {
      onAddMember({
        id: Date.now().toString(),
        name: newName.toUpperCase().replace(/\s+/g, "_"),
        role: newRole.toUpperCase().replace(/\s+/g, "_"),
        email: newEmail.toLowerCase(),
      })
      setNewName("")
      setNewRole("")
      setNewEmail("")
      setShowAddForm(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="border-2 border-[#00FF66] bg-black w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-[#00FF66] p-4 flex justify-between items-center">
          <span className="text-[#00FF66] font-bold">
            {">"} TEAM_REGISTRY
          </span>
          <button
            onClick={onClose}
            className="text-[#FF3333] hover:bg-[#FF3333] hover:text-black px-2 py-1 border border-[#FF3333] transition-colors text-xs"
          >
            [ CLOSE ]
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {team.map((member) => (
              <div
                key={member.id}
                className="border border-[#262626] p-3 bg-[#1A1A1A]"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="text-white font-bold text-sm">
                    {member.name}
                  </div>
                  <div className="text-[#00FF66] text-xs">
                    [{member.role}]
                  </div>
                  <div className="text-[#00FF66]/50 text-xs md:ml-auto">
                    {member.email}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 w-full h-12 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors"
            >
              [ + ADD_MEMBER ]
            </button>
          ) : (
            <div className="mt-4 border border-[#00FF66] p-4">
              <div className="text-[#00FF66] text-xs mb-3">
                {">"} NEW_MEMBER_ENTRY
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="NAME..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-12 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-base placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="ROLE..."
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full h-12 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-base placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="EMAIL..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full h-12 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-base placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 h-12 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors"
                  >
                    [ CONFIRM ]
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="h-12 px-4 border border-[#262626] text-[#00FF66]/50 text-xs hover:border-[#00FF66] transition-colors"
                  >
                    [ CANCEL ]
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Task Card Component
function TaskCard({
  task,
  columnIndex,
  totalColumns,
  onMove,
  onDelete,
}: {
  task: Task
  columnIndex: number
  totalColumns: number
  onMove: (direction: "left" | "right") => void
  onDelete: () => void
}) {
  return (
    <div className="border border-[#262626] bg-[#1A1A1A] p-3">
      <div className="text-white font-bold text-sm mb-2 break-words">
        {task.title}
      </div>
      {task.description && (
        <div className="text-white/70 text-xs mb-3 break-words">
          {task.description}
        </div>
      )}
      <div className="text-[#00FF66] text-xs mb-3">
        @{task.assignee}
      </div>
      <div className="flex gap-2 flex-wrap">
        {columnIndex > 0 && (
          <button
            onClick={() => onMove("left")}
            className="h-8 px-2 border border-[#262626] text-[#00FF66] text-xs hover:border-[#00FF66] transition-colors"
          >
            ← MOVE
          </button>
        )}
        {columnIndex < totalColumns - 1 && (
          <button
            onClick={() => onMove("right")}
            className="h-8 px-2 border border-[#262626] text-[#00FF66] text-xs hover:border-[#00FF66] transition-colors"
          >
            MOVE →
          </button>
        )}
        <button
          onClick={onDelete}
          className="h-8 px-2 border border-[#FF3333]/50 text-[#FF3333] text-xs hover:border-[#FF3333] hover:bg-[#FF3333] hover:text-black transition-colors ml-auto"
        >
          DEL
        </button>
      </div>
    </div>
  )
}

// New Task Form Component
function NewTaskForm({
  team,
  onSubmit,
  onCancel,
}: {
  team: TeamMember[]
  onSubmit: (task: Omit<Task, "id" | "createdAt">) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [assignee, setAssignee] = useState(team[0]?.name || "")

  const handleSubmit = () => {
    if (title.trim()) {
      onSubmit({
        title: title.trim(),
        description: description.trim(),
        assignee,
      })
    }
  }

  return (
    <div className="border border-[#00FF66] p-3 mt-3">
      <div className="text-[#00FF66] text-xs mb-3">{">"} NEW_TASK_ENTRY</div>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="TITLE..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full h-12 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-base placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none"
        />
        <textarea
          placeholder="DESCRIPTION..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#262626] text-white text-base placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none resize-none"
        />
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="w-full h-12 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-base focus:border-[#00FF66] focus:outline-none appearance-none cursor-pointer"
        >
          {team.map((member) => (
            <option key={member.id} value={member.name}>
              {member.name} [{member.role}]
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 h-12 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            [ CREATE ]
          </button>
          <button
            onClick={onCancel}
            className="h-12 px-4 border border-[#262626] text-[#00FF66]/50 text-xs hover:border-[#00FF66] transition-colors"
          >
            [ CANCEL ]
          </button>
        </div>
      </div>
    </div>
  )
}

// Column Component
function KanbanColumn({
  column,
  columnIndex,
  totalColumns,
  team,
  onAddTask,
  onMoveTask,
  onDeleteTask,
  onDeleteColumn,
  isDefault,
}: {
  column: Column
  columnIndex: number
  totalColumns: number
  team: TeamMember[]
  onAddTask: (task: Omit<Task, "id" | "createdAt">) => void
  onMoveTask: (taskId: string, direction: "left" | "right") => void
  onDeleteTask: (taskId: string) => void
  onDeleteColumn: () => void
  isDefault: boolean
}) {
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)

  return (
    <div className="flex-shrink-0 w-72 md:w-80 border border-[#262626] bg-black flex flex-col max-h-full">
      <div className="border-b border-[#262626] p-3 flex items-center justify-between bg-[#1A1A1A]">
        <div className="flex items-center gap-2">
          <span className="text-[#00FF66] font-bold text-sm">
            {column.title}
          </span>
          <span className="text-[#00FF66]/50 text-xs">
            [{column.tasks.length}]
          </span>
        </div>
        {!isDefault && (
          <button
            onClick={onDeleteColumn}
            className="text-[#FF3333]/50 hover:text-[#FF3333] text-xs transition-colors px-2"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            columnIndex={columnIndex}
            totalColumns={totalColumns}
            onMove={(direction) => onMoveTask(task.id, direction)}
            onDelete={() => onDeleteTask(task.id)}
          />
        ))}

        {showNewTaskForm ? (
          <NewTaskForm
            team={team}
            onSubmit={(task) => {
              onAddTask(task)
              setShowNewTaskForm(false)
            }}
            onCancel={() => setShowNewTaskForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowNewTaskForm(true)}
            className="w-full h-12 border border-dashed border-[#262626] text-[#00FF66]/50 text-xs hover:border-[#00FF66] hover:text-[#00FF66] transition-colors"
          >
            [ + NEW TASK ]
          </button>
        )}
      </div>
    </div>
  )
}

// New Column Form Component
function NewColumnForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (title: string) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState("")

  return (
    <div className="flex-shrink-0 w-72 md:w-80 border border-[#00FF66] p-4 bg-black">
      <div className="text-[#00FF66] text-xs mb-3">{">"} NEW_COLUMN</div>
      <input
        type="text"
        placeholder="COLUMN_NAME..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full h-12 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-base placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none mb-3"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={() => title.trim() && onSubmit(title.trim().toUpperCase())}
          disabled={!title.trim()}
          className="flex-1 h-10 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors disabled:opacity-50"
        >
          [ CREATE ]
        </button>
        <button
          onClick={onCancel}
          className="h-10 px-3 border border-[#262626] text-[#00FF66]/50 text-xs hover:border-[#00FF66] transition-colors"
        >
          [ CANCEL ]
        </button>
      </div>
    </div>
  )
}

// Main Board Component
function KanbanBoard({ onLogout }: { onLogout: () => void }) {
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [team, setTeam] = useState<TeamMember[]>(initialTeamMembers)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showNewColumnForm, setShowNewColumnForm] = useState(false)

  const defaultColumnIds = ["backlog", "fazendo", "alteracoes", "aprovado", "feito"]

  const addColumn = (title: string) => {
    const newColumn: Column = {
      id: Date.now().toString(),
      title,
      tasks: [],
    }
    setColumns([...columns, newColumn])
    setShowNewColumnForm(false)
  }

  const deleteColumn = (columnId: string) => {
    setColumns(columns.filter((col) => col.id !== columnId))
  }

  const addTask = (columnId: string, taskData: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setColumns(
      columns.map((col) =>
        col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
      )
    )
  }

  const moveTask = (
    fromColumnId: string,
    taskId: string,
    direction: "left" | "right"
  ) => {
    const fromIndex = columns.findIndex((col) => col.id === fromColumnId)
    const toIndex = direction === "left" ? fromIndex - 1 : fromIndex + 1

    if (toIndex < 0 || toIndex >= columns.length) return

    const task = columns[fromIndex].tasks.find((t) => t.id === taskId)
    if (!task) return

    setColumns(
      columns.map((col, index) => {
        if (index === fromIndex) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
        }
        if (index === toIndex) {
          return { ...col, tasks: [...col.tasks, task] }
        }
        return col
      })
    )
  }

  const deleteTask = (columnId: string, taskId: string) => {
    setColumns(
      columns.map((col) =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
          : col
      )
    )
  }

  const addTeamMember = (member: TeamMember) => {
    setTeam([...team, member])
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header
        onLogout={onLogout}
        onToggleTeam={() => setShowTeamModal(!showTeamModal)}
        showTeam={showTeamModal}
      />

      {showTeamModal && (
        <TeamModal
          team={team}
          onClose={() => setShowTeamModal(false)}
          onAddMember={addTeamMember}
        />
      )}

      <div className="flex-1 p-3 md:p-6 overflow-hidden">
        <div className="flex items-center gap-4 mb-4 overflow-x-auto pb-2">
          <div className="text-[#00FF66] text-sm whitespace-nowrap">
            {">"} BOARD_STATUS: ACTIVE
          </div>
          <div className="text-[#00FF66]/50 text-xs whitespace-nowrap">
            COLUMNS: {columns.length} | TASKS:{" "}
            {columns.reduce((acc, col) => acc + col.tasks.length, 0)}
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] md:h-[calc(100vh-180px)]">
          {columns.map((column, index) => (
            <KanbanColumn
              key={column.id}
              column={column}
              columnIndex={index}
              totalColumns={columns.length}
              team={team}
              onAddTask={(task) => addTask(column.id, task)}
              onMoveTask={(taskId, direction) =>
                moveTask(column.id, taskId, direction)
              }
              onDeleteTask={(taskId) => deleteTask(column.id, taskId)}
              onDeleteColumn={() => deleteColumn(column.id)}
              isDefault={defaultColumnIds.includes(column.id)}
            />
          ))}

          {showNewColumnForm ? (
            <NewColumnForm
              onSubmit={addColumn}
              onCancel={() => setShowNewColumnForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowNewColumnForm(true)}
              className="flex-shrink-0 w-72 md:w-80 h-16 border border-dashed border-[#262626] text-[#00FF66]/50 text-xs hover:border-[#00FF66] hover:text-[#00FF66] transition-colors flex items-center justify-center"
            >
              [ + NEW COLUMN ]
            </button>
          )}
        </div>
      </div>

      <footer className="border-t border-[#262626] p-3 text-center">
        <span className="text-[#00FF66]/30 text-xs">
          BROLABTASK_CLI_v1.0 © BRO.LABS | SESSION_ACTIVE |{" "}
          {new Date().toLocaleTimeString("pt-BR")}
        </span>
      </footer>
    </div>
  )
}

// Main App Component
export default function BroLabTask() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />
  }

  return <KanbanBoard onLogout={() => setIsAuthenticated(false)} />
}

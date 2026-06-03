"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { showToast, ToastContainer } from "@/components/toast-notification"
import {
  DndContext, DragOverlay, closestCorners, closestCenter, KeyboardSensor,
  PointerSensor, TouchSensor, useSensor, useSensors, useDroppable,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// ==================== TYPES ====================
interface Label {
  id: string
  name: string
  color: string
}

interface Comment {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
  mentions?: string[]
  subtaskId?: string | null
}

interface Subtask {
  id: string
  taskId: string
  title: string
  description: string
  estimatedHours: number
  timeSpent: number
  status: string
  position: number
  assignees: string[]
  comments: Comment[]
  files: TaskFile[]
  timerStartedAt: string | null
  createdAt: string
}

interface TaskFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  createdAt: string
}

interface Task {
  id: string
  title: string
  description: string
  columnPosition: number
  position: number
  isComplete: boolean
  isClosed: boolean
  assignees: string[]
  labels: Label[]
  comments: Comment[]
  files: TaskFile[]
  subtaskCount?: number
  totalEstimatedHours?: number
  totalTimeSpent?: number
  createdAt: string
}

interface Column {
  id: string
  name: string
  position: number
  tasks: Task[]
}

interface TeamMember {
  id: string
  name: string
  username: string
  role: string
  email: string
  isAdmin: boolean
}

interface Notification {
  id: string
  type: "mention" | "assignment" | "comment"
  message: string
  taskId: string
  taskTitle: string
  fromUser: string
  createdAt: string
  read: boolean
}

// ==================== LABEL COLORS ====================
const LABEL_COLORS = [
  { name: "Vermelho", value: "#ff4444" },
  { name: "Laranja", value: "#ff8844" },
  { name: "Amarelo", value: "#ffcc00" },
  { name: "Verde", value: "#00ff88" },
  { name: "Verde escuro", value: "#00aa55" },
  { name: "Ciano", value: "#00ccff" },
  { name: "Azul", value: "#4488ff" },
  { name: "Roxo", value: "#aa44ff" },
  { name: "Rosa", value: "#ff44aa" },
  { name: "Cinza", value: "#888888" },
  { name: "Branco", value: "#f0f0f0" },
  { name: "Preto", value: "#2a2a2a" },
]

// ==================== DEFAULT COLUMN IDS ====================
const DEFAULT_COLUMN_NAMES = ["BACKLOG", "FAZENDO", "ALTERAÇÕES", "APROVADO", "FEITO"]

// ==================== LOGIN SCREEN ====================
function LoginScreen({
  onLogin,
  isLoading: externalLoading,
}: {
  onLogin: (email: string, password: string) => Promise<void>
  isLoading: boolean
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setError("")
    setIsLoading(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "ERRO: FALHA_NO_LOGIN")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="border-2 border-[#00FF66] p-6 md:p-10 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-[#00FF66] text-2xl md:text-3xl font-bold mb-2">
            BRO.LABS
          </div>
          <div className="text-[#00FF66]/70 text-sm">{"// AUTH_REQUIRED"}</div>
        </div>

        <div className="border border-[#262626] p-4 mb-6">
          <div className="text-[#00FF66]/50 text-xs mb-2">
            {">"} SYSTEM_STATUS: SECURE
          </div>
          <div className="text-[#00FF66]/50 text-xs mb-2">
            {">"} CONNECTION: SUPABASE_ENCRYPTED
          </div>
          <div className="text-[#00FF66]/50 text-xs">
            {">"} AWAITING_CREDENTIALS...
            <span className="animate-pulse">_</span>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <div className="text-[#00FF66] text-xs mb-2">
              {">"} EMAIL / USERNAME:
            </div>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@domain.com ou @username"
              className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#262626] text-white text-base placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none"
            />
          </div>
          <div>
            <div className="text-[#00FF66] text-xs mb-2">{">"} PASSWORD:</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full h-14 px-4 bg-[#1A1A1A] border border-[#262626] text-white text-base placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
        </div>

        {error && (
          <div className="border border-[#FF3333] bg-[#FF3333]/10 p-3 mb-4 text-[#FF3333] text-xs">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading || externalLoading || !email || !password}
          className="w-full h-14 border-2 border-[#00FF66] bg-black text-[#00FF66] font-mono text-sm hover:bg-[#00FF66] hover:text-black transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading || externalLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-pulse">{">"}</span>
              AUTHENTICATING...
            </span>
          ) : (
            "[ LOGIN ]"
          )}
        </button>

        <div className="mt-6 text-center text-[#00FF66]/30 text-xs">
          BROLABTASK_CLI_v2.0 © BRO.LABS | SUPABASE_CONNECTED
        </div>
      </div>
    </div>
  )
}

// ==================== NOTIFICATION BELL ====================
function NotificationBell({
  notifications,
  onOpen,
}: {
  notifications: Notification[]
  onOpen: () => void
}) {
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <button
      onClick={onOpen}
      className="relative h-10 px-3 border border-[#262626] text-[#00FF66] text-sm hover:border-[#00FF66] transition-colors"
    >
      [ NOTIF ]
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF3333] text-black text-xs flex items-center justify-center animate-pulse">
          {unreadCount}
        </span>
      )}
    </button>
  )
}

// ==================== NOTIFICATIONS MODAL ====================
function NotificationsModal({
  notifications,
  onClose,
  onMarkRead,
  onClearAll,
  team,
}: {
  notifications: Notification[]
  onClose: () => void
  onMarkRead: (id: string) => void
  onClearAll: () => void
  team?: TeamMember[]
}) {
  const [filterUser, setFilterUser] = useState<string>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("bro:notif:filter") || "all"
    return "all"
  })

  const handleFilterChange = (val: string) => {
    setFilterUser(val)
    if (typeof window !== "undefined") localStorage.setItem("bro:notif:filter", val)
  }

  const filtered = notifications.filter((n) => {
    if (filterUser === "all") return true
    if (filterUser === "mine") return n.fromUser === ""
    return n.fromUser === filterUser
  })

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="border-2 border-[#00FF66] bg-black w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-[#00FF66] p-4 flex justify-between items-center">
          <span className="text-[#00FF66] font-bold">{">"} NOTIFICATIONS</span>
          <div className="flex gap-2">
            <button
              onClick={onClearAll}
              className="text-[#00FF66]/50 hover:text-[#00FF66] text-xs px-2 py-1 border border-[#262626] hover:border-[#00FF66] transition-colors"
            >
              [ CLEAR_ALL ]
            </button>
            <button
              onClick={onClose}
              className="text-[#FF3333] hover:bg-[#FF3333] hover:text-black px-2 py-1 border border-[#FF3333] transition-colors text-xs"
            >
              [ CLOSE ]
            </button>
          </div>
        </div>

        <div className="border-b border-[#262626] px-4 py-2 flex items-center gap-2">
          <span className="text-[#00FF66]/50 text-xs">FILTRO:</span>
          <select
            value={filterUser}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="flex-1 h-8 bg-[#1A1A1A] border border-[#262626] text-[#00FF66] text-xs focus:border-[#00FF66] focus:outline-none"
          >
            <option value="all">Todos</option>
            <option value="mine">Apenas minhas</option>
            {team?.map((m) => (
              <option key={m.id} value={m.username}>{m.username}</option>
            ))}
          </select>
          <span className="text-[#888] text-xs">{filtered.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="text-[#00FF66]/50 text-sm text-center py-8">
              {">"} NO_NOTIFICATIONS
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => onMarkRead(notif.id)}
                  className={`border p-3 cursor-pointer transition-colors ${
                    notif.read
                      ? "border-[#262626] bg-[#1A1A1A]"
                      : "border-[#00FF66] bg-[#00FF66]/5"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notif.read && (
                      <span className="w-2 h-2 bg-[#00FF66] mt-1.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm break-words">
                        {notif.message}
                      </div>
                      <div className="text-[#00FF66]/50 text-xs mt-1">
                        {notif.fromUser && <span>@{notif.fromUser} | </span>}
                        {notif.taskTitle} | {new Date(notif.createdAt).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== PROFILE EDIT MODAL ====================
function ProfileEditModal({
  user,
  onClose,
  onSave,
}: {
  user: TeamMember
  onClose: () => void
  onSave: (updates: Partial<TeamMember> & { password?: string }) => void
}) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [password, setPassword] = useState("")
  const [role, setRole] = useState(user.role)

  const handleSave = () => {
    const updates: Partial<TeamMember> & { password?: string } = {
      name: name.toUpperCase().replace(/\s+/g, "_"),
      email,
      role: role.toUpperCase().replace(/\s+/g, "_"),
    }
    if (password) {
      updates.password = password
    }
    onSave(updates)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="border-2 border-[#00FF66] bg-black w-full max-w-md">
        <div className="border-b border-[#00FF66] p-4 flex justify-between items-center">
          <span className="text-[#00FF66] font-bold">{">"} EDIT_PROFILE</span>
          <button
            onClick={onClose}
            className="text-[#FF3333] hover:bg-[#FF3333] hover:text-black px-2 py-1 border border-[#FF3333] transition-colors text-xs"
          >
            [ CLOSE ]
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="text-[#00FF66] text-xs mb-2">{">"} NAME:</div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-base focus:border-[#00FF66] focus:outline-none"
            />
          </div>
          <div>
            <div className="text-[#00FF66] text-xs mb-2">{">"} EMAIL:</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-base focus:border-[#00FF66] focus:outline-none"
            />
          </div>
          <div>
            <div className="text-[#00FF66] text-xs mb-2">{">"} NEW_PASSWORD (deixe vazio para manter):</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full h-12 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-base placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none"
            />
          </div>
          <div>
            <div className="text-[#00FF66] text-xs mb-2">{">"} ROLE:</div>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-12 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-base focus:border-[#00FF66] focus:outline-none"
            />
          </div>
          <div className="text-[#00FF66]/50 text-xs">
            {">"} ROLE_ID: {user.id}
          </div>
          <button
            onClick={handleSave}
            className="w-full h-12 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors"
          >
            [ SAVE_CHANGES ]
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== TEAM ADMIN MODAL ====================
function TeamAdminModal({
  team,
  currentUser,
  onClose,
  onAddMember,
  onDeleteMember,
}: {
  team: TeamMember[]
  currentUser: TeamMember
  onClose: () => void
  onAddMember: (member: { name: string; username: string; role: string; email: string; password: string; isAdmin: boolean }) => void
  onDeleteMember: (id: string) => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newUsername, setNewUsername] = useState("")
  const [newRole, setNewRole] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newIsAdmin, setNewIsAdmin] = useState(false)

  const handleSubmit = () => {
    if (newName.trim() && newEmail.trim() && newPassword.trim()) {
      onAddMember({
        name: newName.toUpperCase().replace(/\s+/g, "_"),
        username: newUsername.toLowerCase().replace(/\s+/g, ".") || newEmail.split("@")[0],
        role: newRole.toUpperCase().replace(/\s+/g, "_") || "COLLABORATOR",
        email: newEmail.toLowerCase(),
        password: newPassword,
        isAdmin: newIsAdmin,
      })
      setNewName("")
      setNewUsername("")
      setNewRole("")
      setNewEmail("")
      setNewPassword("")
      setNewIsAdmin(false)
      setShowAddForm(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="border-2 border-[#00FF66] bg-black w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-[#00FF66] p-4 flex justify-between items-center">
          <span className="text-[#00FF66] font-bold">
            {">"} TEAM_REGISTRY {currentUser.isAdmin && "[ ADMIN_MODE ]"}
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
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">
                      {member.name}
                    </span>
                    {member.isAdmin && (
                      <span className="text-[#FF3333] text-xs border border-[#FF3333] px-1">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-[#00FF66] text-xs">
                    @{member.username} | [{member.role}]
                  </div>
                  <div className="text-[#00FF66]/50 text-xs md:ml-auto flex items-center gap-2">
                    {member.email}
                    {currentUser.isAdmin && member.id !== currentUser.id && (
                      <button
                        onClick={() => onDeleteMember(member.id)}
                        className="text-[#FF3333] hover:bg-[#FF3333] hover:text-black px-2 py-1 border border-[#FF3333] transition-colors"
                      >
                        DEL
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {currentUser.isAdmin && (
            <>
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 w-full h-12 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors"
                >
                  [ + CREATE_USER ]
                </button>
              ) : (
                <div className="mt-4 border border-[#00FF66] p-4">
                  <div className="text-[#00FF66] text-xs mb-3">
                    {">"} NEW_USER_ENTRY
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
                      placeholder="USERNAME (ex: joao.silva)..."
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
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
                    <input
                      type="password"
                      placeholder="PASSWORD..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-12 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-base placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none"
                    />
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => setNewIsAdmin(!newIsAdmin)}
                        className={`w-6 h-6 border flex items-center justify-center transition-colors ${
                          newIsAdmin
                            ? "border-[#00FF66] bg-[#00FF66] text-black"
                            : "border-[#262626]"
                        }`}
                      >
                        {newIsAdmin && "✓"}
                      </div>
                      <span className="text-[#00FF66] text-xs">
                        ADMIN_PRIVILEGES
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSubmit}
                        disabled={!newName.trim() || !newEmail.trim() || !newPassword.trim()}
                        className="flex-1 h-12 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors disabled:opacity-50"
                      >
                        [ CREATE ]
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== LABEL BADGE ====================
function LabelBadge({ label }: { label: Label }) {
  const isDark = label.color === "#FFFFFF" || label.color === "#A3E635" || label.color === "#84CC16"
  return (
    <span
      className="px-2 py-0.5 text-xs font-bold"
      style={{
        backgroundColor: label.color,
        color: isDark ? "#000000" : "#FFFFFF",
      }}
    >
      {label.name}
    </span>
  )
}

// ==================== LABEL MANAGER ====================
function LabelManager({
  labels,
  onAdd,
  onRemove,
  taskId,
  workspaceLabels,
  onToggleWorkspaceLabel,
}: {
  labels: Label[]
  onAdd: (label: Label) => void
  onRemove: (id: string) => void
  taskId?: string
  workspaceLabels?: Label[]
  onToggleWorkspaceLabel?: (labelId: string) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].value)
  const [search, setSearch] = useState("")

  const handleAdd = async () => {
    if (newName.trim()) {
      onAdd({
        id: Date.now().toString(),
        name: newName.trim().toUpperCase(),
        color: selectedColor,
      })
      setNewName("")
      setSelectedColor(LABEL_COLORS[0].value)
      setShowForm(false)
    }
  }

  const filteredWorkspace = (workspaceLabels || []).filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="border border-[#262626] p-3">
      <div className="text-[#00FF66] text-xs mb-3">{">"} LABELS:</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {labels.map((label) => (
          <div key={label.id} className="flex items-center gap-1">
            <LabelBadge label={label} />
            <button
              onClick={() => onRemove(label.id)}
              className="text-[#FF3333] text-xs hover:bg-[#FF3333] hover:text-black px-1 transition-colors"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {workspaceLabels && workspaceLabels.length > 0 && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Buscar etiqueta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 px-2 bg-[#1A1A1A] border border-[#262626] text-white text-xs placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none mb-2"
          />
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {filteredWorkspace.map((wl) => {
              const isActive = labels.some(l => l.id === wl.id)
              return (
                <button
                  key={wl.id}
                  onClick={() => onToggleWorkspaceLabel?.(wl.id)}
                  className={`flex items-center gap-1 px-2 py-1 text-xs border rounded transition-colors ${
                    isActive
                      ? "border-[#00FF66] bg-[#00FF66]/10 text-[#00FF66]"
                      : "border-[#262626] text-[#888] hover:border-[#3a3a3a]"
                  }`}
                >
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: wl.color }} />
                  {wl.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full h-10 border border-dashed border-[#262626] text-[#00FF66]/50 text-xs hover:border-[#00FF66] hover:text-[#00FF66] transition-colors"
        >
          [ + ADD_LABEL ]
        </button>
      ) : (
        <div className="space-y-3 border border-[#00FF66] p-3">
          <input
            type="text"
            placeholder="LABEL_NAME..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full h-10 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-sm placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none"
          />
          <div className="grid grid-cols-6 gap-2">
            {LABEL_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setSelectedColor(c.value)}
                className={`w-full aspect-square border-2 transition-colors rounded ${
                  selectedColor === c.value
                    ? "border-[#00FF66] scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>
          <div className="text-[#00FF66]/50 text-[10px]">{selectedColor}</div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="flex-1 h-10 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors disabled:opacity-50"
            >
              [ ADD ]
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="h-10 px-3 border border-[#262626] text-[#00FF66]/50 text-xs hover:border-[#00FF66] transition-colors"
            >
              [ CANCEL ]
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== MENTION INPUT ====================
function MentionInput({
  value,
  onChange,
  onSubmit,
  team,
  placeholder,
}: {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
  team: TeamMember[]
  placeholder?: string
}) {
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowMentions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    const lastAtIndex = newValue.lastIndexOf("@")
    if (lastAtIndex !== -1 && lastAtIndex === newValue.length - 1) {
      setShowMentions(true)
      setMentionFilter("")
    } else if (lastAtIndex !== -1) {
      const textAfterAt = newValue.slice(lastAtIndex + 1)
      if (!textAfterAt.includes(" ")) {
        setShowMentions(true)
        setMentionFilter(textAfterAt.toLowerCase())
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  const handleSelectMention = (member: TeamMember) => {
    const lastAtIndex = value.lastIndexOf("@")
    const newValue = value.slice(0, lastAtIndex) + "@" + member.username + " "
    onChange(newValue)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  const filteredTeam = team.filter(
    (m) =>
      m.username.toLowerCase().includes(mentionFilter) ||
      m.name.toLowerCase().includes(mentionFilter)
  )

  return (
    <div ref={containerRef} className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#262626] text-white text-base placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none resize-none"
      />
      {showMentions && filteredTeam.length > 0 && (
        <div className="absolute left-0 right-0 bottom-full mb-1 bg-black border border-[#00FF66] max-h-40 overflow-y-auto z-10">
          {filteredTeam.map((member) => (
            <button
              key={member.id}
              onClick={() => handleSelectMention(member)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[#00FF66] hover:text-black transition-colors"
            >
              <span className="text-[#00FF66]">@{member.username}</span>
              <span className="text-white ml-2">{member.name}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        className="mt-2 w-full h-10 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors disabled:opacity-50"
      >
        [ POST_COMMENT ]
      </button>
    </div>
  )
}

// ==================== SUBTASK ROW ====================
function SubtaskRow({
  subtask,
  onUpdateStatus,
  onAddComment,
  onUploadComplete,
  currentUser,
  team,
}: {
  subtask: Subtask
  onUpdateStatus: (id: string, newStatus: string) => void
  onAddComment: (subtaskId: string, content: string) => void
  onUploadComplete?: () => void
  currentUser: TeamMember
  team: TeamMember[]
}) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [liveTime, setLiveTime] = useState(subtask.timeSpent)

  useEffect(() => {
    if (!subtask.timerStartedAt) {
      setLiveTime(subtask.timeSpent)
      return
    }
    const interval = setInterval(() => {
      const elapsed = (Date.now() - new Date(subtask.timerStartedAt).getTime()) / 1000
      setLiveTime(subtask.timeSpent + Math.round(elapsed))
    }, 1000)
    return () => clearInterval(interval)
  }, [subtask.timerStartedAt, subtask.timeSpent])

  const STATUS_ORDER = ["BACKLOG", "FAZENDO", "ALTERAÇÕES", "APROVADO", "FEITO"]
  const currentIndex = STATUS_ORDER.indexOf(subtask.status)
  const isTimerRunning = !!subtask.timerStartedAt

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    await onAddComment(subtask.id, newComment.trim())
    setNewComment("")
  }

  const compareBar = () => {
    const est = subtask.estimatedHours * 3600
    if (est === 0) return null
    const pct = Math.min((liveTime / est) * 100, 100)
    const color = liveTime > est ? "#FF3333" : "#00FF66"
    return (
      <div className="mt-2">
        <div className="flex justify-between text-[10px] text-[#00FF66]/50 mb-1">
          <span>Estimado: {subtask.estimatedHours}h</span>
          <span>Real: {formatTime(liveTime)}</span>
        </div>
        <div className="w-full h-1.5 bg-[#262626]">
          <div
            className="h-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="border border-[#262626] bg-[#1A1A1A] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-bold break-words">{subtask.title}</div>
          {subtask.description && (
            <div className="text-white/60 text-xs mt-1 break-words">{subtask.description}</div>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 border ${isTimerRunning ? "border-[#00FF66] text-[#00FF66] animate-pulse" : "border-[#262626] text-[#00FF66]/70"}`}>
              {isTimerRunning ? "▶ CRONOMETRO" : subtask.status}
            </span>
            <span className="text-xs text-[#00FF66]/70">{formatTime(liveTime)}</span>
            {subtask.estimatedHours > 0 && (
              <span className="text-xs text-[#00FF66]/50">EST: {subtask.estimatedHours}h</span>
            )}
          </div>
          {compareBar()}
          <div className="flex gap-1 mt-2 flex-wrap">
            {currentIndex > 0 && (
              <button onClick={() => onUpdateStatus(subtask.id, STATUS_ORDER[currentIndex - 1])}
                className="h-6 px-1.5 border border-[#262626] text-[#00FF66] text-[10px] hover:border-[#00FF66] transition-colors">←</button>
            )}
            {currentIndex < STATUS_ORDER.length - 1 && (
              <button onClick={() => onUpdateStatus(subtask.id, STATUS_ORDER[currentIndex + 1])}
                className="h-6 px-1.5 border border-[#262626] text-[#00FF66] text-[10px] hover:border-[#00FF66] transition-colors">→</button>
            )}
            <button onClick={() => setShowComments(!showComments)}
              className="h-6 px-1.5 border border-[#262626] text-[#00FF66]/50 text-[10px] hover:border-[#00FF66] transition-colors">
              [{subtask.comments.length}]
            </button>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="mt-3 border-t border-[#262626] pt-3 space-y-2">
          {subtask.comments.length === 0 && (
            <div className="text-[#00FF66]/50 text-xs">NO_COMMENTS</div>
          )}
          {subtask.comments.map((c) => (
            <div key={c.id} className="border border-[#262626] bg-black p-2">
              <div className="text-[#00FF66] text-[10px] font-bold">{c.authorName}</div>
              <div className="text-white text-xs mt-1">{c.content}</div>
            </div>
          ))}
          {subtask.files.length > 0 && (
            <div className="space-y-1">
              <div className="text-[#00FF66]/50 text-[10px]">ARQUIVOS:</div>
              {subtask.files.map((f) => (
                <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer"
                  className="block border border-[#262626] bg-black p-1.5 text-[#00FF66] text-[10px] hover:underline">
                  {f.name} ({(f.size / 1024).toFixed(1)} KB)
                </a>
              ))}
            </div>
          )}
          <MentionInput value={newComment} onChange={setNewComment}
            onSubmit={handleAddComment} team={team} placeholder="Comentário (use @ para mencionar)..." />
          <label className="flex items-center gap-2 cursor-pointer p-1.5 border border-dashed border-[#262626] hover:border-[#00FF66] transition-colors">
            <span className="text-[#00FF66]/50 text-[10px]">[ UPLOAD_FILE ]</span>
            <input type="file" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const formData = new FormData()
                formData.append("file", file)
                formData.append("subtaskId", subtask.id)
                try {
                  const res = await fetch("/api/upload", { method: "POST", body: formData })
                  if (res.ok) { if (onUploadComplete) onUploadComplete() }
                } catch (err) { console.error("Upload failed:", err) }
              }} />
          </label>
        </div>
      )}
    </div>
  )
}

// ==================== TASK EDIT MODAL ====================
function TaskEditModal({
  task,
  team,
  currentUser,
  onClose,
  onSave,
  onAddComment,
  onEditComment,
  onUploadComplete,
}: {
  task: Task
  team: TeamMember[]
  currentUser: TeamMember
  onClose: () => void
  onSave: (updates: Partial<Task>) => void
  onAddComment: (content: string, mentions: string[]) => void
  onEditComment?: (commentId: string, content: string) => void
  onUploadComplete?: () => void
}) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [assignees, setAssignees] = useState<string[]>(task.assignees)
  const [labels, setLabels] = useState<Label[]>(task.labels)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newComment, setNewComment] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState("")
  const [showNewSubtask, setShowNewSubtask] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [newSubtaskEstHours, setNewSubtaskEstHours] = useState("")
  const [improving, setImproving] = useState(false)
  const [workspaceLabels, setWorkspaceLabels] = useState<Label[]>([])
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    fetch(`/api/subtasks?taskId=${task.id}`)
      .then((r) => r.json())
      .then((d) => setSubtasks(d.subtasks || []))
      .catch(() => {})
    fetch("/api/workspace-labels")
      .then((r) => r.json())
      .then((d) => setWorkspaceLabels(d.labels || []))
      .catch(() => {})
  }, [task.id])

  const totalEstimatedHours = subtasks.reduce((s, st) => s + (st.estimatedHours || 0), 0)
  const totalTimeSpent = subtasks.reduce((s, st) => s + st.timeSpent, 0)

  const handleSave = () => {
    onSave({
      title,
      description,
      assignees,
      labels,
    })
    onClose()
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      const mentions = (newComment.match(/@(\w+)/g) || []).map((m) =>
        m.slice(1).toLowerCase()
      )
      onAddComment(newComment.trim(), mentions)
      setNewComment("")
    }
  }

  const handleEditComment = (commentId: string) => {
    if (editingCommentContent.trim()) {
      onEditComment?.(commentId, editingCommentContent.trim())
      setEditingCommentId(null)
      setEditingCommentContent("")
    }
  }

  const toggleAssignee = (name: string) => {
    if (assignees.includes(name)) {
      setAssignees(assignees.filter((a) => a !== name))
    } else {
      setAssignees([...assignees, name])
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return
    try {
      await fetch("/api/subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          title: newSubtaskTitle.trim(),
          estimatedHours: parseFloat(newSubtaskEstHours) || 0,
          position: subtasks.length,
        }),
      })
      setNewSubtaskTitle("")
      setNewSubtaskEstHours("")
      setShowNewSubtask(false)
      const res = await fetch(`/api/subtasks?taskId=${task.id}`)
      const d = await res.json()
      setSubtasks(d.subtasks || [])
    } catch (err) {
      console.error("Error creating subtask:", err)
    }
  }

  const handleSubtaskStatusUpdate = async (subtaskId: string, newStatus: string) => {
    try {
      await fetch("/api/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId, newStatus }),
      })
      const res = await fetch(`/api/subtasks?taskId=${task.id}`)
      const d = await res.json()
      setSubtasks(d.subtasks || [])
    } catch (err) {
      console.error("Error updating subtask status:", err)
    }
  }

  const handleSubtaskComment = async (subtaskId: string, content: string) => {
    try {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          subtaskId,
          authorUsername: currentUser.username,
          content,
        }),
      })
      const res = await fetch(`/api/subtasks?taskId=${task.id}`)
      const d = await res.json()
      setSubtasks(d.subtasks || [])
    } catch (err) {
      console.error("Error adding subtask comment:", err)
    }
  }

  const improveDescription = async () => {
    if (!description.trim() || improving) return
    setImproving(true)
    try {
      const res = await fetch("/api/ai/improve-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, cardTitle: task.title }),
      })
      const { data } = await res.json()
      if (data?.improved) setDescription(data.improved)
    } catch (e) {
      console.error(e)
    } finally {
      setImproving(false)
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="border-2 border-[#00FF66] bg-black max-w-3xl mx-auto">
          <div className="border-b border-[#00FF66] p-4 flex justify-between items-center sticky top-0 bg-black z-10">
            <span className="text-[#00FF66] font-bold">{">"} EDIT_TASK</span>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="text-[#00FF66] hover:bg-[#00FF66] hover:text-black px-3 py-1 border border-[#00FF66] transition-colors text-xs"
              >
                [ SAVE ]
              </button>
              <button
                onClick={onClose}
                className="text-[#FF3333] hover:bg-[#FF3333] hover:text-black px-2 py-1 border border-[#FF3333] transition-colors text-xs"
              >
                [ CLOSE ]
              </button>
            </div>
          </div>

          <div className="p-4 space-y-6">
            <div>
              <div className="text-[#00FF66] text-xs mb-2">{">"} TITLE:</div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-base focus:border-[#00FF66] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[#00FF66] text-xs">{">"} DESCRIPTION:</div>
                <button
                  onClick={improveDescription}
                  disabled={improving || !description.trim()}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] border border-[#2a2a2a] rounded hover:border-[#00ff88] hover:text-[#00ff88] text-[#888] transition-all disabled:opacity-40"
                >
                  {improving ? (
                    <span className="animate-pulse">✦ melhorando...</span>
                  ) : (
                    <>✦ melhorar com IA</>
                  )}
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#262626] text-white text-base focus:border-[#00FF66] focus:outline-none resize-none"
              />
            </div>

            <div>
              <div className="text-[#00FF66] text-xs mb-2">{">"} ASSIGNEES:</div>
              <div className="flex flex-wrap gap-2">
                {team.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => toggleAssignee(member.name)}
                    className={`px-3 py-2 border text-xs transition-colors ${
                      assignees.includes(member.name)
                        ? "border-[#00FF66] bg-[#00FF66] text-black"
                        : "border-[#262626] text-white hover:border-[#00FF66]"
                    }`}
                  >
                    @{member.username}
                  </button>
                ))}
              </div>
            </div>

            <LabelManager
              labels={labels}
              onAdd={(label) => setLabels([...labels, label])}
              onRemove={(id) => setLabels(labels.filter((l) => l.id !== id))}
              taskId={task.id}
              workspaceLabels={workspaceLabels}
              onToggleWorkspaceLabel={async (labelId) => {
                await fetch("/api/workspace-labels/toggle", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ cardId: task.id, labelId }),
                })
                const label = workspaceLabels.find(l => l.id === labelId)
                if (!label) return
                const exists = labels.some(l => l.id === labelId)
                if (exists) {
                  setLabels(labels.filter(l => l.id !== labelId))
                } else {
                  setLabels([...labels, label])
                }
              }}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[#00FF66] text-xs">{">"} SUBTASKS:</div>
                <div className="text-[#00FF66]/50 text-[10px]">
                  EST: {totalEstimatedHours}h | REAL: {formatTime(totalTimeSpent)}
                </div>
              </div>

              {totalEstimatedHours > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-[#00FF66]/50 mb-1">
                    <span>Total Estimado: {totalEstimatedHours}h</span>
                    <span>Total Real: {formatTime(totalTimeSpent)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#262626]">
                    <div
                      className="h-full bg-[#00FF66] transition-all"
                      style={{ width: `${Math.min((totalTimeSpent / (totalEstimatedHours * 3600)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 mb-3">
                {subtasks.length === 0 && (
                  <div className="text-[#00FF66]/50 text-xs">NO_SUBTASKS</div>
                )}
                {subtasks.map((st) => (
                  <SubtaskRow
                    key={st.id}
                    subtask={st}
                    onUpdateStatus={handleSubtaskStatusUpdate}
                    onAddComment={handleSubtaskComment}
                    onUploadComplete={onUploadComplete}
                    currentUser={currentUser}
                    team={team}
                  />
                ))}
              </div>

              {showNewSubtask ? (
                <div className="border border-[#00FF66] p-3 space-y-2">
                  <input value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="SUBTASK_TITLE..."
                    className="w-full h-10 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-sm placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none" />
                  <input value={newSubtaskEstHours} onChange={(e) => setNewSubtaskEstHours(e.target.value)}
                    placeholder="ESTIMATED_HOURS (ex: 2.5)"
                    type="number" step="0.5" min="0"
                    className="w-full h-10 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-sm placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none" />
                  <div className="flex gap-2">
                    <button onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}
                      className="flex-1 h-10 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors disabled:opacity-50">[ ADD ]</button>
                    <button onClick={() => setShowNewSubtask(false)}
                      className="h-10 px-3 border border-[#262626] text-[#00FF66]/50 text-xs hover:border-[#00FF66] transition-colors">[ CANCEL ]</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowNewSubtask(true)}
                  className="w-full h-10 border border-dashed border-[#262626] text-[#00FF66]/50 text-xs hover:border-[#00FF66] hover:text-[#00FF66] transition-colors">
                  [ + ADD_SUBTASK ]
                </button>
              )}
            </div>

            <div>
              <div className="text-[#00FF66] text-xs mb-2">{">"} FILES:</div>
              <div className="space-y-2 mb-3">
                {task.files.length === 0 ? (
                  <div className="text-[#00FF66]/50 text-xs">NO_FILES</div>
                ) : (
                  task.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between border border-[#262626] bg-[#1A1A1A] p-2"
                    >
                      <a href={file.url} target="_blank" rel="noopener noreferrer"
                        className="text-[#00FF66] text-xs hover:underline truncate flex-1">{file.name}</a>
                      <span className="text-[#00FF66]/50 text-xs ml-2 shrink-0">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-[#262626] hover:border-[#00FF66] p-3 transition-colors">
                <span className="text-[#00FF66] text-xs">[ UPLOAD_FILE ]</span>
                <input type="file" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const formData = new FormData()
                    formData.append("file", file)
                    formData.append("taskId", task.id)
                    try {
                      const res = await fetch("/api/upload", { method: "POST", body: formData })
                      if (res.ok) { if (onUploadComplete) onUploadComplete() }
                    } catch (err) { console.error("Upload failed:", err) }
                  }} />
              </label>
            </div>

            <div className="border border-[#262626] p-3">
              <div className="text-[#00FF66] text-xs mb-3">{">"} COMMENT_HISTORY:</div>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {task.comments.length === 0 ? (
                  <div className="text-[#00FF66]/50 text-xs">NO_COMMENTS</div>
                ) : (
                  task.comments.map((comment) => (
                    <div key={comment.id} className="border border-[#262626] bg-[#1A1A1A] p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#00FF66] text-xs font-bold">{comment.authorName}</span>
                        <span className="text-[#00FF66]/50 text-xs">
                          {new Date(comment.createdAt).toLocaleString("pt-BR")}
                        </span>
                        {comment.authorName === currentUser.username && (
                          <button onClick={() => {
                            if (editingCommentId === comment.id) { setEditingCommentId(null) }
                            else { setEditingCommentId(comment.id); setEditingCommentContent(comment.content) }
                          }}
                            className="ml-auto text-[#00FF66]/50 hover:text-[#00FF66] text-xs px-1 border border-[#262626] hover:border-[#00FF66] transition-colors">[ EDIT ]</button>
                        )}
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <textarea value={editingCommentContent} onChange={(e) => setEditingCommentContent(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-black border border-[#00FF66] text-white text-sm focus:outline-none resize-none" />
                          <div className="flex gap-2">
                            <button onClick={() => handleEditComment(comment.id)} disabled={!editingCommentContent.trim()}
                              className="flex-1 h-8 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors disabled:opacity-50">[ SAVE_EDIT ]</button>
                            <button onClick={() => setEditingCommentId(null)}
                              className="h-8 px-3 border border-[#262626] text-[#00FF66]/50 text-xs hover:border-[#00FF66] transition-colors">[ CANCEL ]</button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-white text-sm break-words">{comment.content}</div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="text-[#00FF66] text-xs mb-2">{">"} NEW_COMMENT (use @ para mencionar):</div>
              <MentionInput value={newComment} onChange={setNewComment}
                onSubmit={handleAddComment} team={team} placeholder="Digite seu comentário..." />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-[#00FF66]/50 text-xs">
                {">"} CREATED: {new Date(task.createdAt).toLocaleString("pt-BR")} | ID: {task.id.slice(0, 8)}...
              </div>
              {!confirmArchive ? (
                <button
                  onClick={() => setConfirmArchive(true)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] border border-[#2a2a2a] rounded text-[#888] hover:border-[#ffcc00] hover:text-[#ffcc00] transition-all"
                >
                  🗄 arquivar
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#ffcc00]">Confirmar?</span>
                  <button
                    onClick={async () => {
                      setArchiving(true)
                      await fetch(`/api/cards/${task.id}/archive`, { method: "POST" })
                      onClose()
                    }}
                    disabled={archiving}
                    className="px-2 py-1 bg-[#ffcc00] text-[#0a0a0a] text-[10px] rounded font-bold hover:bg-[#e6b800] transition-colors"
                  >
                    sim
                  </button>
                  <button
                    onClick={() => setConfirmArchive(false)}
                    className="px-2 py-1 border border-[#2a2a2a] text-[#888] text-[10px] rounded hover:border-[#00FF66] transition-colors"
                  >
                    não
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== TASK CARD ====================
function SortableTaskCard({
  task,
  columnIndex,
  taskIndex,
  totalColumns,
  totalTasks,
  onMove,
  onMoveVertical,
  onDelete,
  onEdit,
  onCancel,
  onToggleComplete,
}: {
  task: Task
  columnIndex: number
  taskIndex: number
  totalColumns: number
  totalTasks: number
  onMove: (direction: "left" | "right") => void
  onMoveVertical: (direction: "up" | "down") => void
  onDelete: () => void
  onEdit: () => void
  onCancel?: () => void
  onToggleComplete?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onEdit}
      className={`border p-3 cursor-pointer transition-colors relative ${
        task.isComplete
          ? "bg-[#00ff88] border-[#00cc6a]"
          : "border-[#262626] bg-[#1A1A1A] hover:border-[#00FF66]/50"
      }`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggleComplete?.() }}
        className={`absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-sm z-10 transition-colors ${
          task.isComplete
            ? "text-[#0a0a0a]"
            : "text-[#888] hover:text-[#00ff88]"
        }`}
        title={task.isComplete ? "Marcar como pendente" : "Marcar como concluída"}
      >
        {task.isComplete ? "✓" : "○"}
      </button>
      <div {...attributes} {...listeners} className={`text-xs mb-1 cursor-grab active:cursor-grabbing select-none ${task.isComplete ? "text-[#0a2a1a]" : "text-[#00FF66]/30"}`}>
        ⠿ {task.title ? "DRAG" : ""}
      </div>
      {task.labels.length > 0 && (
        <div className={`flex flex-wrap gap-1 mb-2 ${task.isComplete ? "opacity-70" : ""}`}>
          {task.labels.map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
        </div>
      )}

      <div className={`font-bold text-sm mb-2 break-words ${task.isComplete ? "text-[#0a0a0a] line-through" : "text-white"}`}>{task.title}</div>
      {task.description && (
        <div className={`text-xs mb-3 break-words line-clamp-2 ${task.isComplete ? "text-[#0a0a0a]" : "text-white/70"}`}>{task.description}</div>
      )}

      <div className={`text-xs mb-3 flex flex-wrap gap-1 ${task.isComplete ? "text-[#0a2a1a]" : "text-[#00FF66]"}`}>
        {task.assignees.map((assignee, i) => {
          const display = assignee.startsWith("@") ? assignee : `@${assignee.toLowerCase().replace(/\s+/g, "_")}`
          return <span key={i}>{display}{i < task.assignees.length - 1 ? "," : ""}</span>
        })}
      </div>

      {task.comments.length > 0 && (
        <div className={`text-xs mb-3 ${task.isComplete ? "text-[#0a2a1a]/70" : "text-[#00FF66]/50"}`}>[ {task.comments.length} COMMENT{task.comments.length > 1 ? "S" : ""} ]</div>
      )}
      {task.files && task.files.length > 0 && (
        <div className={`text-xs mb-3 ${task.isComplete ? "text-[#0a2a1a]/70" : "text-[#00FF66]/50"}`}>[ {task.files.length} FILE{task.files.length > 1 ? "S" : ""} ]</div>
      )}
      {task.subtaskCount !== undefined && task.subtaskCount > 0 && (
        <div className={`text-xs mb-3 ${task.isComplete ? "text-[#0a2a1a]/70" : "text-[#00FF66]/50"}`}>
          [ {task.subtaskCount} SUBTASK{(task.subtaskCount || 0) > 1 ? "S" : ""} ]
          {(task.totalEstimatedHours || 0) > 0 && <> | EST: {task.totalEstimatedHours}h</>}
          {(task.totalTimeSpent || 0) > 0 && (
            <> | REAL: {Math.floor((task.totalTimeSpent || 0) / 3600)}h {Math.floor(((task.totalTimeSpent || 0) % 3600) / 60)}m</>
          )}
        </div>
      )}

      <div className="flex gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-1 mr-1">
          <button
            onClick={() => onMoveVertical("up")}
            disabled={taskIndex === 0}
            className="h-6 w-6 border border-[#262626] text-[#00FF66] text-xs hover:border-[#00FF66] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          >▲</button>
          <button
            onClick={() => onMoveVertical("down")}
            disabled={taskIndex === totalTasks - 1}
            className="h-6 w-6 border border-[#262626] text-[#00FF66] text-xs hover:border-[#00FF66] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          >▼</button>
        </div>
        {columnIndex > 0 && (
          <button onClick={() => onMove("left")} className="h-8 px-2 border border-[#262626] text-[#00FF66] text-xs hover:border-[#00FF66] transition-colors">←</button>
        )}
        {columnIndex < totalColumns - 1 && (
          <button onClick={() => onMove("right")} className="h-8 px-2 border border-[#262626] text-[#00FF66] text-xs hover:border-[#00FF66] transition-colors">→</button>
        )}
        <button onClick={onDelete} className="h-8 px-2 border border-[#FF3333]/50 text-[#FF3333] text-xs hover:border-[#FF3333] hover:bg-[#FF3333] hover:text-black transition-colors ml-auto">DEL</button>
        {onCancel && <button onClick={onCancel} className="h-8 px-2 border border-[#FF3333] text-[#FF3333] text-xs hover:bg-[#FF3333] hover:text-black transition-colors">✕</button>}
      </div>
    </div>
  )
}

// ==================== NEW TASK FORM ====================
function NewTaskForm({
  team,
  onSubmit,
  onCancel,
}: {
  team: TeamMember[]
  onSubmit: (task: { title: string; description: string; assignees: string[] }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [assignees, setAssignees] = useState<string[]>([team[0]?.name || ""])

  const toggleAssignee = (name: string) => {
    if (assignees.includes(name)) {
      if (assignees.length > 1) {
        setAssignees(assignees.filter((a) => a !== name))
      }
    } else {
      setAssignees([...assignees, name])
    }
  }

  const handleSubmit = () => {
    if (title.trim()) {
      onSubmit({
        title: title.trim(),
        description: description.trim(),
        assignees,
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
        <div>
          <div className="text-[#00FF66] text-xs mb-2">{">"} SELECT_ASSIGNEES:</div>
          <div className="flex flex-wrap gap-2">
            {team.map((member) => (
              <button
                key={member.id}
                onClick={() => toggleAssignee(member.name)}
                className={`px-2 py-1 border text-xs transition-colors ${
                  assignees.includes(member.name)
                    ? "border-[#00FF66] bg-[#00FF66] text-black"
                    : "border-[#262626] text-white hover:border-[#00FF66]"
                }`}
              >
                @{member.username}
              </button>
            ))}
          </div>
        </div>
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

// ==================== NEW TASK MODAL (global, backlog-forced) ====================
function NewTaskModal({
  team,
  backlogColumn,
  onClose,
  onSubmit,
}: {
  team: TeamMember[]
  backlogColumn: Column | null
  onClose: () => void
  onSubmit: (task: { title: string; description: string; assignees: string[] }) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [assignees, setAssignees] = useState<string[]>([team[0]?.name || ""])
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const toggleAssignee = (name: string) => {
    if (assignees.includes(name)) {
      if (assignees.length > 1) setAssignees(assignees.filter((a) => a !== name))
    } else {
      setAssignees([...assignees, name])
    }
  }

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return
    setSubmitting(true)
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      assignees,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="border-2 border-[#00FF66] bg-black max-w-md w-full p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[#00FF66] font-bold text-sm">{">"} NOVA_TAREFA</span>
          {backlogColumn && (
            <span className="text-[10px] text-[#00FF66]/60 border border-[#00FF66]/30 px-2 py-0.5">
              Status inicial: {backlogColumn.name}
            </span>
          )}
        </div>

        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="TÍTULO *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
            className="w-full h-12 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-base placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none"
          />
          <textarea
            placeholder="DESCRIÇÃO (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#262626] text-white text-base placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none resize-none"
          />
          <div>
            <div className="text-[#00FF66] text-xs mb-2">{">"} SELECT_ASSIGNEES:</div>
            <div className="flex flex-wrap gap-2">
              {team.map((member) => (
                <button
                  key={member.id}
                  onClick={() => toggleAssignee(member.name)}
                  className={`px-2 py-1 border text-xs transition-colors ${
                    assignees.includes(member.name)
                      ? "border-[#00FF66] bg-[#00FF66] text-black"
                      : "border-[#262626] text-white hover:border-[#00FF66]"
                  }`}
                >
                  @{member.username}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || submitting}
              className="flex-1 h-12 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "CRIANDO..." : "[ CRIAR ]"}
            </button>
            <button
              onClick={onClose}
              className="h-12 px-4 border border-[#262626] text-[#00FF66]/50 text-xs hover:border-[#00FF66] transition-colors"
            >
              [ CANCELAR ]
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== EMPTY LIST DROP ZONE ====================
function EmptyListDropZone({ columnId }: { columnId: string }) {
  const { isOver, setNodeRef } = useDroppable({ id: `empty-${columnId}`, data: { type: "list", listId: columnId } })
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] border-2 border-dashed rounded transition-all ${
        isOver ? "border-[#00ff88] bg-[rgba(0,255,136,0.06)]" : "border-[#2a2a2a]"
      }`}
    />
  )
}

// ==================== KANBAN COLUMN ====================
function KanbanColumn({
  column,
  columnIndex,
  totalColumns,
  team,
  onMoveTask,
  onMoveTaskVertical,
  onDeleteTask,
  onDeleteColumn,
  onEditTask,
  onCancelTask,
  isDefault,
  onMoveColumn,
  columnPosition,
  allColumnsCount,
  onToggleComplete,
}: {
  column: Column
  columnIndex: number
  totalColumns: number
  team: TeamMember[]
  onMoveTask: (taskId: string, direction: "left" | "right") => void
  onMoveTaskVertical: (taskId: string, direction: "up" | "down") => void
  onDeleteTask: (taskId: string) => void
  onDeleteColumn: () => void
  onEditTask: (task: Task) => void
  onCancelTask?: (task: Task) => void
  isDefault: boolean
  onMoveColumn?: (direction: "left" | "right") => void
  columnPosition?: number
  allColumnsCount?: number
  onToggleComplete?: (taskId: string) => void
}) {
  const taskIds = column.tasks.map((t) => t.id)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(column.name)
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState("")
  const nameInputRef = useRef<HTMLInputElement>(null)

  const saveColumnName = async () => {
    const trimmed = nameDraft.trim()
    if (!trimmed) { setNameError("Nome não pode ser vazio"); return }
    if (trimmed.length > 50) { setNameError("Máximo 50 caracteres"); return }
    if (trimmed === column.name) { setEditingName(false); return }
    setNameSaving(true)
    try {
      const res = await fetch(`/api/columns/${encodeURIComponent(column.name)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) { setNameError(data.error || "Erro ao renomear"); return }
      column.name = trimmed
      setEditingName(false)
      setNameError("")
    } catch { setNameError("Erro de conexão") }
    finally { setNameSaving(false) }
  }

  return (
    <div className="flex-shrink-0 w-72 md:w-80 border border-[#262626] bg-black flex flex-col max-h-full">
      <div className="border-b border-[#262626] p-3 flex items-center justify-between bg-[#1A1A1A]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {editingName ? (
            <div className="relative flex-1">
              <input
                ref={nameInputRef}
                value={nameDraft}
                onChange={(e) => { setNameDraft(e.target.value); setNameError("") }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveColumnName()
                  if (e.key === "Escape") { setEditingName(false); setNameDraft(column.name); setNameError("") }
                }}
                onBlur={saveColumnName}
                maxLength={55}
                autoFocus
                className="w-full bg-[#0a0a0a] border rounded px-1.5 py-0.5 text-xs text-[#f0f0f0] focus:outline-none"
              />
              {nameSaving && <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-[#00ff88] animate-pulse">✓</span>}
              {nameError && <div className="absolute top-full left-0 mt-1 text-[10px] text-[#ff4444] bg-[#1a0000] border border-[#5a0000] rounded px-2 py-1 z-50 whitespace-nowrap">{nameError}</div>}
            </div>
          ) : (
            <span
              onClick={() => { setNameDraft(column.name); setEditingName(true); setTimeout(() => nameInputRef.current?.select(), 50) }}
              className="text-[#00FF66] font-bold text-sm truncate cursor-pointer hover:text-[#00ff88] transition-colors"
              title="Clique para renomear"
            >{column.name}</span>
          )}
          <span className="text-[#00FF66]/50 text-xs shrink-0">[{column.tasks.length}]</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onMoveColumn && columnPosition !== undefined && (
            <>
              <button
                onClick={() => onMoveColumn("left")}
                disabled={columnPosition === 0}
                className="h-5 w-5 border border-[#262626] text-[#00FF66] text-[10px] hover:border-[#00FF66] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >◀</button>
              <button
                onClick={() => onMoveColumn("right")}
                disabled={columnPosition === (allColumnsCount ?? totalColumns) - 1}
                className="h-5 w-5 border border-[#262626] text-[#00FF66] text-[10px] hover:border-[#00FF66] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >▶</button>
            </>
          )}
          {!isDefault && (
            <button onClick={onDeleteColumn} className="text-[#FF3333]/50 hover:text-[#FF3333] text-xs transition-colors px-1">×</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task, taskIndex) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              columnIndex={columnIndex}
              taskIndex={taskIndex}
              totalColumns={totalColumns}
              totalTasks={column.tasks.length}
              onMove={(direction) => onMoveTask(task.id, direction)}
              onMoveVertical={(direction) => onMoveTaskVertical(task.id, direction)}
              onDelete={() => onDeleteTask(task.id)}
              onEdit={() => onEditTask(task)}
              onCancel={onCancelTask ? () => onCancelTask(task) : undefined}
              onToggleComplete={() => onToggleComplete?.(task.id)}
            />
          ))}
          {column.tasks.length === 0 && (
            <EmptyListDropZone columnId={column.id} />
          )}
        </SortableContext>
      </div>
    </div>
  )
}

// ==================== NEW COLUMN FORM ====================
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

// ==================== HEADER ====================
function Header({
  currentUser,
  notifications,
  onLogout,
  onToggleTeam,
  onToggleNotifications,
  onEditProfile,
  showTeam,
}: {
  currentUser: TeamMember
  notifications: Notification[]
  onLogout: () => void
  onToggleTeam: () => void
  onToggleNotifications: () => void
  onEditProfile: () => void
  showTeam: boolean
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b-2 border-[#00FF66] bg-black sticky top-0 z-40">
      <div className="px-3 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#00FF66]">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-8 h-8 bg-[#1A1A1A] border border-[#262626] flex items-center justify-center mr-2"
            >
              <span className="text-[#888] text-xs">{mobileMenuOpen ? "✕" : "☰"}</span>
            </button>
            <span className="text-lg md:text-xl font-bold">BRO.LABS</span>
            <span className="text-[#00FF66]/50 text-xs hidden sm:inline">
              {"// BROLABTASK_CLI_v2.0"}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="border border-[#262626] px-3 py-2 text-xs">
              <span className="text-[#00FF66]/50">USER:</span>
              <span className="text-white ml-2">@{currentUser.username}</span>
              {currentUser.isAdmin && (
                <span className="text-[#FF3333] ml-2">[ADMIN]</span>
              )}
            </div>

            <NotificationBell
              notifications={notifications}
              onOpen={onToggleNotifications}
            />

            <button
              onClick={onEditProfile}
              className="h-10 px-3 border border-[#262626] text-[#00FF66] text-xs hover:border-[#00FF66] transition-colors"
            >
              [ EDIT_PROFILE ]
            </button>

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

          <div className="flex md:hidden items-center gap-2">
            <NotificationBell
              notifications={notifications}
              onOpen={onToggleNotifications}
            />
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-[#262626] space-y-2">
            <div className="border border-[#262626] px-3 py-2 text-xs">
              <span className="text-[#00FF66]/50">USER:</span>
              <span className="text-white ml-2">@{currentUser.username}</span>
              {currentUser.isAdmin && (
                <span className="text-[#FF3333] ml-2">[ADMIN]</span>
              )}
            </div>
            <button onClick={onEditProfile}
              className="w-full h-10 border border-[#262626] text-[#00FF66] text-xs hover:border-[#00FF66] transition-colors">[ EDIT_PROFILE ]</button>
            <button onClick={onToggleTeam}
              className={`w-full h-10 border text-xs transition-colors ${
                showTeam
                  ? "border-[#00FF66] bg-[#00FF66] text-black"
                  : "border-[#00FF66] bg-black text-[#00FF66] hover:bg-[#262626]"
              }`}>[ VIEW_TEAM ]</button>
            <button onClick={onLogout}
              className="w-full h-10 border border-[#FF3333] text-[#FF3333] text-xs hover:bg-[#FF3333] hover:text-black transition-colors">[ EXIT_SESSION ]</button>
          </div>
        )}
      </div>
    </header>
  )
}

// ==================== LOADING SCREEN ====================
function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="border-2 border-[#00FF66] p-6 md:p-10 w-full max-w-md text-center">
        <div className="text-[#00FF66] text-2xl md:text-3xl font-bold mb-4">
          BRO.LABS
        </div>
        <div className="text-[#00FF66]/70 text-sm mb-6">
          {">"} {message}
          <span className="animate-pulse">_</span>
        </div>
        <div className="w-full h-1 bg-[#262626]">
          <div className="h-full bg-[#00FF66] animate-pulse" style={{ width: "60%" }} />
        </div>
      </div>
    </div>
  )
}

// ==================== ARCHIVED CARDS ====================
function ArchivedCards({
  onClose,
  onRestore,
}: {
  onClose: () => void
  onRestore: (cardId: string) => void
}) {
  const [cards, setCards] = useState<Array<{ id: string; title: string; columnName: string; updatedAt: string; labels: Label[] }>>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/cards/archived`)
      .then((r) => r.json())
      .then((d) => setCards(d.cards || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = cards.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-[#111] border-l border-[#2a2a2a] shadow-2xl z-40 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-[#2a2a2a]">
        <span className="text-[#00FF66] text-xs font-bold">ARQUIVADOS</span>
        <button onClick={onClose} className="text-[#888] hover:text-[#00FF66] text-xs">✕</button>
      </div>
      <div className="p-3 border-b border-[#2a2a2a]">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-8 px-2 bg-[#1A1A1A] border border-[#262626] text-white text-xs placeholder:text-[#00FF66]/30 focus:border-[#00FF66] focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="text-[#888] text-xs text-center py-8">CARREGANDO...</div>
        ) : filtered.length === 0 ? (
          <div className="text-[#888] text-xs text-center py-8">NENHUM CARD ARQUIVADO</div>
        ) : (
          filtered.map((card) => (
            <div key={card.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-2.5">
              <div className="text-xs text-[#f0f0f0] line-through opacity-60 font-medium">{card.title}</div>
              <div className="text-[10px] text-[#888] mt-1">{card.columnName}</div>
              {card.labels.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {card.labels.map((l) => (
                    <span key={l.id} className="w-4 h-1.5 rounded-sm" style={{ backgroundColor: l.color }} />
                  ))}
                </div>
              )}
              <div className="text-[10px] text-[#555] mt-1">
                {new Date(card.updatedAt).toLocaleDateString("pt-BR")}
              </div>
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => onRestore(card.id)}
                  className="flex-1 py-1 bg-[#00ff88] text-[#0a0a0a] text-[10px] rounded font-bold hover:bg-[#00cc6a] transition-colors"
                >
                  RESTAURAR
                </button>
                <button
                  onClick={async () => {
                    await fetch(`/api/tasks?id=${card.id}`, { method: "DELETE" })
                    setCards(cards.filter((c) => c.id !== card.id))
                  }}
                  className="px-2 py-1 border border-[#ff4444] text-[#ff4444] text-[10px] rounded hover:bg-[#ff4444] hover:text-white transition-colors"
                >
                  EXCLUIR
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ==================== LIST VIEW ====================
function ListView({
  columns,
  onEditTask,
  onToggleComplete,
}: {
  columns: Column[]
  onEditTask: (task: Task, columnId: string) => void
  onToggleComplete?: (taskId: string) => void
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [showCompleted, setShowCompleted] = useState(false)

  const toggleCollapse = (colId: string) => {
    setCollapsed(prev => ({ ...prev, [colId]: !prev[colId] }))
  }

  return (
    <div className="overflow-y-auto h-full pb-4">
      {columns.map((col) => {
        const filtered = showCompleted ? col.tasks : col.tasks.filter(t => !t.isComplete)
        const isCollapsed = collapsed[col.id]
        return (
          <div key={col.id} className="mb-4 border border-[#262626] rounded">
            <div
              onClick={() => toggleCollapse(col.id)}
              className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border-b border-[#2a2a2a] cursor-pointer hover:bg-[#222] transition-colors"
            >
              <span className="text-[#00FF66] text-xs font-bold">{isCollapsed ? "▶" : "▼"}</span>
              <span className="text-[#f0f0f0] text-xs font-bold">{col.name}</span>
              <span className="bg-[#2a2a2a] text-[#888] text-[10px] px-2 py-0.5 rounded-sm">{col.tasks.length}</span>
              {!showCompleted && col.tasks.filter(t => t.isComplete).length > 0 && (
                <span className="text-[#00ff88] text-[10px] ml-auto">+{col.tasks.filter(t => t.isComplete).length} concluída(s)</span>
              )}
            </div>
            {!isCollapsed && (
              <div className="overflow-x-auto">
                {filtered.length === 0 ? (
                  <div className="text-[#888] text-xs p-4 text-center">Nenhuma tarefa</div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1a1a1a] text-[#888] text-[10px]">
                        <th className="w-8 p-2"></th>
                        <th className="text-left p-2">Título</th>
                        <th className="text-left p-2 hidden sm:table-cell">Etiquetas</th>
                        <th className="text-left p-2 hidden md:table-cell">Responsáveis</th>
                        <th className="text-left p-2 hidden lg:table-cell">Criado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((task) => (
                        <tr
                          key={task.id}
                          onClick={() => onEditTask(task, col.id)}
                          className={`border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-all cursor-pointer ${
                            task.isComplete ? "bg-[#00ff88]/5" : "bg-[#111]"
                          }`}
                        >
                          <td className="p-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => { e.stopPropagation(); onToggleComplete?.(task.id) }}
                              className={`w-5 h-5 flex items-center justify-center rounded-sm transition-colors ${
                                task.isComplete ? "text-[#00ff88]" : "text-[#888] hover:text-[#00ff88]"
                              }`}
                            >
                              {task.isComplete ? "✓" : "○"}
                            </button>
                          </td>
                          <td className={`p-2 font-medium ${task.isComplete ? "text-[#00ff88] line-through" : "text-[#f0f0f0]"}`}>
                            {task.title}
                          </td>
                          <td className="p-2 hidden sm:table-cell">
                            <div className="flex gap-1 flex-wrap">
                              {task.labels.slice(0, 3).map((l) => (
                                <span key={l.id} className="w-5 h-1.5 rounded-sm inline-block" style={{ backgroundColor: l.color }} />
                              ))}
                              {task.labels.length > 3 && (
                                <span className="text-[#888] text-[10px]">+{task.labels.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-2 hidden md:table-cell">
                            <div className="flex gap-1">
                              {task.assignees.map((a, i) => (
                                <span key={i} className="w-5 h-5 bg-[#00ff88] rounded-sm flex items-center justify-center text-[#0a0a0a] text-[8px] font-bold">
                                  {a.charAt(0)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-2 text-[#888] hidden lg:table-cell">
                            {new Date(task.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )
      })}
      {columns.length > 0 && (
        <label className="flex items-center gap-2 px-3 py-2 cursor-pointer">
          <input type="checkbox" checked={showCompleted} onChange={() => setShowCompleted(!showCompleted)}
            className="accent-[#00ff88]" />
          <span className="text-[#888] text-xs">Mostrar concluídas</span>
        </label>
      )}
    </div>
  )
}

// ==================== MAIN BOARD ====================
function KanbanBoard({
  currentUser,
  team,
  columns,
  notifications,
  onLogout,
  onUpdateUser,
  onAddTeamMember,
  onDeleteTeamMember,
  onAddColumn,
  onDeleteColumn,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
  onAddComment,
  onMarkNotificationRead,
  onClearAllNotifications,
  refreshData,
  onReorderColumns,
  onToggleComplete,
}: {
  currentUser: TeamMember
  team: TeamMember[]
  columns: Column[]
  notifications: Notification[]
  onLogout: () => void
  onUpdateUser: (updates: Partial<TeamMember> & { password?: string }) => void
  onAddTeamMember: (member: { name: string; username: string; role: string; email: string; password: string; isAdmin: boolean }) => void
  onDeleteTeamMember: (id: string) => void
  onAddColumn: (name: string) => void
  onDeleteColumn: (id: string) => void
  onAddTask: (columnId: string, task: { title: string; description: string; assignees: string[] }) => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
  onMoveTask: (taskId: string, fromColumnId: string, toColumnId: string, newPosition?: number) => void
  onAddComment: (taskId: string, content: string, mentions: string[]) => void
  onEditComment: (taskId: string, commentId: string, content: string) => void
  onMarkNotificationRead: (id: string) => void
  onClearAllNotifications: () => void
  refreshData: () => void
  onReorderColumns?: (columns: Column[]) => void
  onToggleComplete?: (taskId: string) => void
}) {
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showNewColumnForm, setShowNewColumnForm] = useState(false)
  const [editingTask, setEditingTask] = useState<{
    task: Task
    columnId: string
  } | null>(null)
  const [activeTask, setActiveTask] = useState<{ task: Task; columnId: string } | null>(null)
  const [filterAssignee, setFilterAssignee] = useState<string[]>([])
  const [filterLabel, setFilterLabel] = useState<string[]>([])
  const [filterSearch, setFilterSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "complete">("all")
  const [pendingCloseTask, setPendingCloseTask] = useState<{
  taskId: string
  fromColumnId: string
  toColumnId: string
  newPosition?: number
  isToggle?: boolean
} | null>(null)
  const [cancelModalTask, setCancelModalTask] = useState<Task | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [showArchived, setShowArchived] = useState(false)
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)

  const allLabels: Label[] = columns.flatMap((c) => c.tasks.flatMap((t) => t.labels))
    .filter((l, i, arr) => arr.findIndex((x) => x.id === l.id) === i)

  const filteredColumns = columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((t) => {
      if (filterSearch && !t.title.toLowerCase().includes(filterSearch.toLowerCase())) return false
      if (filterAssignee.length > 0 && !t.assignees.some((a) => filterAssignee.includes(a))) return false
      if (filterLabel.length > 0 && !t.labels.some((l) => filterLabel.includes(l.id))) return false
      if (filterStatus === "active" && t.isComplete) return false
      if (filterStatus === "complete" && !t.isComplete) return false
      return true
    }),
  }))

  const findColumnByTaskId = (taskId: string) =>
    columns.find((c) => c.tasks.some((t) => t.id === taskId))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string
    const column = findColumnByTaskId(taskId)
    const task = column?.tasks.find((t) => t.id === taskId)
    if (task && column) setActiveTask({ task, columnId: column.id })
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeCol = findColumnByTaskId(active.id as string)
    const overCol = findColumnByTaskId(over.id as string)
    if (!activeCol || !overCol || activeCol.id === overCol.id) return
    if (isClosingColumn(overCol.id)) {
      checkSubtaskCompletion(active.id as string).then((ok) => {
        if (!ok) {
          setActiveTask(null)
          showToast("Task possui subtarefas pendentes! Feche-as antes.", "warning")
          return
        }
      })
    }
    const activeIndex = activeCol.tasks.findIndex((t) => t.id === active.id)
    const overIndex = overCol.tasks.findIndex((t) => t.id === over.id)
    if (activeIndex === -1) return
    onMoveTask(active.id as string, activeCol.id, overCol.id, overIndex === -1 ? overCol.tasks.length : overIndex)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
  }

  const isClosingColumn = (colId: string) => {
    const col = columns.find((c) => c.id === colId)
    return col?.name === "FEITO"
  }

  const checkSubtaskCompletion = async (taskId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/subtasks?taskId=${taskId}`)
      const d = await res.json()
      const sts: Subtask[] = d.subtasks || []
      return sts.length === 0 || sts.every((st) => st.status === "APROVADO" || st.status === "FEITO")
    } catch { return true }
  }

  const handleMoveTask = async (columnId: string, taskId: string, direction: "left" | "right") => {
    const columnIndex = columns.findIndex((c) => c.id === columnId)
    const toIndex = direction === "left" ? columnIndex - 1 : columnIndex + 1
    if (toIndex < 0 || toIndex >= columns.length) return
    const toColumnId = columns[toIndex].id
    if (isClosingColumn(toColumnId)) {
      const ok = await checkSubtaskCompletion(taskId)
      if (!ok) {
        setPendingCloseTask({ taskId, fromColumnId: columnId, toColumnId })
        return
      }
    }
    onMoveTask(taskId, columnId, toColumnId)
  }

  const handleMoveTaskVertical = (columnId: string, taskId: string, direction: "up" | "down") => {
    const column = columns.find((c) => c.id === columnId)
    if (!column) return
    const taskIndex = column.tasks.findIndex((t) => t.id === taskId)
    if (taskIndex === -1) return
    const newPosition = direction === "up" ? taskIndex - 1 : taskIndex + 1
    if (newPosition < 0 || newPosition >= column.tasks.length) return
    onMoveTask(taskId, columnId, columnId, newPosition)
  }

  const handleColumnMove = (columnId: string, direction: "left" | "right") => {
    const idx = columns.findIndex((c) => c.id === columnId)
    if (idx === -1) return
    const targetIdx = direction === "left" ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= columns.length) return
    const reordered = [...columns]
    ;[reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]]
    reordered.forEach((c, i) => { c.position = i })
    if (onReorderColumns) onReorderColumns(reordered)
    fetch(`/api/columns/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columns: reordered.map((c, i) => ({ id: c.id, position: i })) }),
    }).catch(console.error)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header
        currentUser={currentUser}
        notifications={notifications}
        onLogout={onLogout}
        onToggleTeam={() => setShowTeamModal(!showTeamModal)}
        onToggleNotifications={() => setShowNotifications(!showNotifications)}
        onEditProfile={() => setShowProfileEdit(true)}
        showTeam={showTeamModal}
      />

      {showNotifications && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkRead={onMarkNotificationRead}
          onClearAll={onClearAllNotifications}
          team={team}
        />
      )}

      {showTeamModal && (
        <TeamAdminModal
          team={team}
          currentUser={currentUser}
          onClose={() => setShowTeamModal(false)}
          onAddMember={onAddTeamMember}
          onDeleteMember={onDeleteTeamMember}
        />
      )}

      {showProfileEdit && (
        <ProfileEditModal
          user={currentUser}
          onClose={() => setShowProfileEdit(false)}
          onSave={onUpdateUser}
        />
      )}

      {editingTask && (
        <TaskEditModal
          task={editingTask.task}
          team={team}
          currentUser={currentUser}
          onClose={() => {
            setEditingTask(null)
            refreshData()
          }}
          onSave={(updates) => {
            onUpdateTask(editingTask.task.id, updates)
          }}
          onAddComment={(content, mentions) => {
            onAddComment(editingTask.task.id, content, mentions)
          }}
          onEditComment={(commentId, content) => {
            onEditComment(editingTask.task.id, commentId, content)
          }}
          onUploadComplete={refreshData}
        />
      )}

      {pendingCloseTask && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="border-2 border-[#FF3333] bg-black max-w-lg w-full p-6">
            <div className="text-[#FF3333] font-bold text-sm mb-4">{">"} SUBTAREFAS_PENDENTES</div>
            <div className="text-white/70 text-xs mb-6">
              {pendingCloseTask.isToggle
                ? "Esta tarefa possui subtarefas que ainda não foram concluídas. Deseja marcá-la como concluída mesmo assim?"
                : "Esta tarefa possui subtarefas que ainda não foram concluídas (APROVADO/FEITO). Deseja movê-la para FEITO mesmo assim?"}
            </div>
            <div className="flex gap-3">
              <button onClick={async () => {
                const pt = pendingCloseTask
                setPendingCloseTask(null)
                if (pt.isToggle) {
                  await doToggleComplete(pt.taskId, true)
                } else {
                  onMoveTask(pt.taskId, pt.fromColumnId, pt.toColumnId, pt.newPosition)
                }
              }} className="flex-1 h-10 border border-[#FF3333] text-[#FF3333] text-xs hover:bg-[#FF3333] hover:text-black transition-colors">
                {pendingCloseTask.isToggle ? "[ MARCAR_CONCLUIDA ]" : "[ FORCAR_MOVER ]"}
              </button>
              <button onClick={() => setPendingCloseTask(null)} className="flex-1 h-10 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors">[ CANCELAR ]</button>
            </div>
          </div>
        </div>
      )}

      {cancelModalTask && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="border-2 border-[#FF3333] bg-black max-w-lg w-full p-6">
            <div className="text-[#FF3333] font-bold text-sm mb-4">{">"} CANCELAR_TAREFA</div>
            <div className="text-white/70 text-xs mb-4">Justificativa para cancelamento de "{cancelModalTask.title}":</div>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              rows={4} placeholder="MOTIVO_DO_CANCELAMENTO..."
              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#262626] text-white text-sm placeholder:text-[#FF3333]/30 focus:border-[#FF3333] focus:outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={async () => {
                if (!cancelModalTask || !cancelReason.trim()) { showToast("Informe o motivo do cancelamento.", "warning"); return }
                onUpdateTask(cancelModalTask.id, { description: `${cancelModalTask.description}\n[CANCELADO: ${cancelReason.trim()}]` })
                setCancelModalTask(null)
                setCancelReason("")
                showToast("Tarefa cancelada.", "warning")
              }} className="flex-1 h-10 border border-[#FF3333] text-[#FF3333] text-xs hover:bg-[#FF3333] hover:text-black transition-colors">[ CONFIRMAR_CANCELAMENTO ]</button>
              <button onClick={() => { setCancelModalTask(null); setCancelReason("") }} className="flex-1 h-10 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors">[ VOLTAR ]</button>
            </div>
          </div>
        </div>
      )}

      {showNewTaskModal && (
        <NewTaskModal
          team={team}
          backlogColumn={columns.length > 0 ? columns.reduce((a, b) => a.position < b.position ? a : b) : null}
          onClose={() => setShowNewTaskModal(false)}
          onSubmit={async (task) => {
            const backlog = columns.reduce((a, b) => a.position < b.position ? a : b)
            if (backlog) {
              onAddTask(backlog.id, task)
            }
            setShowNewTaskModal(false)
          }}
        />
      )}

      <div className="flex-1 p-3 md:p-6 overflow-hidden">
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 flex-wrap">
          <div className="text-[#00FF66] text-sm whitespace-nowrap">{">"} BOARD_STATUS: SUPABASE_CONNECTED</div>
          <div className="text-[#00FF66]/50 text-xs whitespace-nowrap">COLUMNS: {columns.length} | TASKS: {columns.reduce((acc, col) => acc + col.tasks.length, 0)}</div>
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="h-8 px-3 border border-[#00ff88] bg-[#00ff88] text-black text-[10px] font-bold hover:bg-[#00e67a] transition-colors flex items-center gap-1 shadow-[0_0_8px_rgba(0,255,136,0.25)]"
          >
            + NOVA TAREFA
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`w-8 h-8 flex items-center justify-center rounded text-xs transition-colors ${
                viewMode === "kanban"
                  ? "border border-[#00ff88] bg-[rgba(0,255,136,0.08)] text-[#00ff88]"
                  : "border border-[#2a2a2a] text-[#888] hover:border-[#3a3a3a]"
              }`}
              title="Kanban"
            >⊞</button>
            <button
              onClick={() => setViewMode("list")}
              className={`w-8 h-8 flex items-center justify-center rounded text-xs transition-colors ${
                viewMode === "list"
                  ? "border border-[#00ff88] bg-[rgba(0,255,136,0.08)] text-[#00ff88]"
                  : "border border-[#2a2a2a] text-[#888] hover:border-[#3a3a3a]"
              }`}
              title="Lista"
            >☰</button>
          </div>
          <div className="relative">
            <input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="buscar..."
              className="h-8 w-28 bg-[#1A1A1A] border border-[#262626] rounded px-2 text-[10px] text-[#f0f0f0] placeholder:text-[#555] focus:border-[#00FF66] focus:outline-none focus:w-36 transition-all"
            />
            {filterSearch && (
              <button
                onClick={() => setFilterSearch("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#f0f0f0] text-[10px]"
              >×</button>
            )}
          </div>

          <select
            value={filterAssignee[0] || ""}
            onChange={(e) => {
              const val = e.target.value
              setFilterAssignee(val ? [val] : [])
            }}
            className="h-8 max-w-[110px] bg-[#1A1A1A] border border-[#262626] text-[#00FF66] text-[10px] focus:border-[#00FF66] focus:outline-none"
          >
            <option value="">Membro</option>
            {team.map((m) => (
              <option key={m.id} value={m.name}>
                {filterAssignee.includes(m.name) ? "✓ " : ""}@{m.username}
              </option>
            ))}
          </select>

          <select
            value={filterLabel[0] || ""}
            onChange={(e) => {
              const val = e.target.value
              setFilterLabel(val ? [val] : [])
            }}
            className="h-8 max-w-[110px] bg-[#1A1A1A] border border-[#262626] text-[#00FF66] text-[10px] focus:border-[#00FF66] focus:outline-none"
          >
            <option value="">Label</option>
            {allLabels.map((l) => (
              <option key={l.id} value={l.id}>
                {filterLabel.includes(l.id) ? "✓ " : ""}{l.name}
              </option>
            ))}
          </select>

          <div className="flex gap-0">
            {(["all", "active", "complete"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`h-8 px-2 text-[10px] transition-colors first:rounded-l last:rounded-r ${
                  filterStatus === s
                    ? "bg-[#00FF66] text-black font-bold border border-[#00FF66]"
                    : "bg-[#1A1A1A] text-[#888] border border-[#262626] hover:border-[#3a3a3a]"
                }`}
              >
                {s === "all" ? "Todas" : s === "active" ? "Ativas" : "Feitas"}
              </button>
            ))}
          </div>

          {(filterAssignee.length > 0 || filterLabel.length > 0 || filterSearch || filterStatus !== "all") && (
            <button
              onClick={() => { setFilterAssignee([]); setFilterLabel([]); setFilterSearch(""); setFilterStatus("all") }}
              className="h-8 px-2 border border-[#FF3333]/50 text-[#FF3333] text-[10px] hover:border-[#FF3333] transition-colors"
            >LIMPAR</button>
          )}
          <button
            onClick={() => setShowArchived(true)}
            className="h-8 px-2 border border-[#2a2a2a] text-[#888] text-[10px] hover:border-[#3a3a3a] hover:text-[#f0f0f0] transition-colors flex items-center gap-1"
          >
            🗄 arquivados
          </button>
        </div>

        {showArchived && (
          <ArchivedCards
            onClose={() => setShowArchived(false)}
            onRestore={async (cardId) => {
              await fetch(`/api/cards/${cardId}/restore`, { method: "POST" })
              setShowArchived(false)
              refreshData()
            }}
          />
        )}
        {viewMode === "kanban" ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] md:h-[calc(100vh-180px)]">
              {filteredColumns.map((column, index) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  columnIndex={index}
                  totalColumns={filteredColumns.length}
                  team={team}
                  onMoveTask={(taskId, direction) => handleMoveTask(column.id, taskId, direction)}
                  onMoveTaskVertical={(taskId, direction) => handleMoveTaskVertical(column.id, taskId, direction)}
                  onDeleteTask={(taskId) => onDeleteTask(taskId)}
                  onDeleteColumn={() => onDeleteColumn(column.id)}
                  onEditTask={(task) => setEditingTask({ task, columnId: column.id })}
                  onCancelTask={(task) => setCancelModalTask(task)}
                  isDefault={DEFAULT_COLUMN_NAMES.includes(column.name)}
                  onMoveColumn={(dir) => handleColumnMove(column.id, dir)}
                  columnPosition={columns.findIndex((c) => c.id === column.id)}
                  allColumnsCount={columns.length}
                  onToggleComplete={onToggleComplete}
                />
              ))}

            {showNewColumnForm ? (
              <NewColumnForm
                onSubmit={(name) => {
                  onAddColumn(name)
                  setShowNewColumnForm(false)
                }}
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
          <DragOverlay dropAnimation={{ duration: 150, easing: "ease-out" }}>
            {activeTask ? (
              <div className="w-72 bg-[#1e1e1e] border-2 border-[#00ff88] rounded p-2.5 shadow-2xl opacity-95 rotate-1 scale-105 font-mono">
                <p className="text-xs text-[#f0f0f0] font-bold">{activeTask.task.title}</p>
                <p className="text-[#00FF66] text-[10px] mt-1">[ DRAGGING ]</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        ) : (
          <ListView
            columns={filteredColumns}
            onEditTask={(task, colId) => setEditingTask({ task, columnId: colId })}
            onToggleComplete={onToggleComplete}
          />
        )}
      </div>

      <footer className="border-t border-[#262626] p-3 text-center">
        <span className="text-[#00FF66]/30 text-xs">
          BROLABTASK_CLI_v2.0 © BRO.LABS | SUPABASE_SYNC |{" "}
          {new Date().toLocaleTimeString("pt-BR")}
        </span>
      </footer>
    </div>
  )
}

// ==================== TOKEN REFRESH HELPER ====================
let refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = fetch("/api/auth/refresh", { method: "POST" })
    .then((r) => r.ok)
    .finally(() => { refreshPromise = null })
  return refreshPromise
}

async function fetchWithRefresh(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init)
  if (res.status === 401) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      return fetch(url, init)
    }
  }
  return res
}

// ==================== MAIN APP ====================
export default function BroLabTask() {
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null)
  const [team, setTeam] = useState<TeamMember[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState("INITIALIZING_SYSTEM...")

  // Fetch all data from API
  const fetchData = useCallback(async () => {
    try {
      const [columnsRes, tasksRes, usersRes] = await Promise.all([
        fetchWithRefresh("/api/columns"),
        fetchWithRefresh("/api/tasks"),
        fetchWithRefresh("/api/users"),
      ])

      const [columnsData, tasksData, usersData] = await Promise.all([
        columnsRes.json().catch(() => ({})),
        tasksRes.json().catch(() => ({})),
        usersRes.json().catch(() => ({})),
      ])

      // Combine columns with their tasks
      const columnsList = Array.isArray(columnsData.columns) ? columnsData.columns : []
      const tasksList = Array.isArray(tasksData.tasks) ? tasksData.tasks : []
      const usersList = Array.isArray(usersData.users) ? usersData.users : []

      const columnsWithTasks = columnsList.map((col: { id: string; name: string; position: number }) => ({
        ...col,
        tasks: tasksList.filter((t: Task) => t.columnPosition === col.position).sort((a: Task, b: Task) => a.position - b.position),
      }))

      setColumns(columnsWithTasks)
      setTeam(usersList)

      if (!tasksRes.ok) {
        console.error("Error loading tasks:", tasksData)
      }

      if (!usersRes.ok) {
        console.error("Error loading users:", usersData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }, [])

  // Fetch notifications for current user
  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`)
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }, [currentUser])

  // Initial load: restore session then fetch data
  useEffect(() => {
    const init = async () => {
      setLoadingMessage("RESTORING_SESSION...")
      try {
        // Primeiro tenta com o cookie atual
        let meRes = await fetch("/api/auth/me")
        // Se 401, tenta refresh silencioso
        if (meRes.status === 401) {
          const refreshed = await tryRefreshToken()
          if (refreshed) {
            meRes = await fetch("/api/auth/me")
          }
        }
        if (meRes.ok) {
          const meData = await meRes.json()
          if (meData.user) {
            setCurrentUser(meData.user)
            setLoadingMessage("CONNECTING_TO_SUPABASE...")
            await fetchData()
            setLoadingMessage("SYSTEM_READY")
            setIsLoading(false)
            return
          }
        }
      } catch { /* no session */ }
      setIsLoading(false)
    }
    init()
  }, [fetchData])

  // Auto-refresh do token a cada 30 minutos
  useEffect(() => {
    if (!currentUser) return
    const interval = setInterval(() => {
      tryRefreshToken()
    }, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [currentUser])

  // Subscribe to realtime notifications for current user and fetch initial list
  useEffect(() => {
    if (!currentUser) return
    // Load existing notifications
    fetchNotifications()
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications_user_${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          // Adjust filter field name if needed
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const n = payload.new
          const newNotif = {
            id: n.id,
            type: n.type,
            message: n.message,
            taskId: n.task_id,
            taskTitle: n.task_title,
            fromUser: n.from_user,
            createdAt: n.created_at,
            read: n.read,
          }
          setNotifications((prev) => [newNotif, ...prev])
          showToast(n.message || `Nova notificação`, n.type === 'mention' ? 'warning' : 'info')
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, fetchNotifications])

  // Login handler
  const handleLogin = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || "ERRO: FALHA_NO_LOGIN")
    }
    setCurrentUser(data.user)
    await fetchData()
  }

  // Logout handler
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setCurrentUser(null)
    setNotifications([])
  }

  // Update user profile
  const handleUpdateUser = async (updates: Partial<TeamMember> & { password?: string }) => {
    if (!currentUser) return
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentUser.id, ...updates }),
      })
      const data = await res.json()
      if (res.ok) {
        setCurrentUser(data.user)
        await fetchData()
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  // Add team member
  const handleAddTeamMember = async (member: { name: string; username: string; role: string; email: string; password: string; isAdmin: boolean }) => {
    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: member.name,
          username: member.username,
          email: member.email,
          password: member.password,
          role: member.isAdmin ? "ADMIN" : (member.role || "COLLABORATOR"),
        }),
      })
      await fetchData()
    } catch (error) {
      console.error("Error adding team member:", error)
    }
  }

  // Delete team member
  const handleDeleteTeamMember = async (id: string) => {
    try {
      await fetch(`/api/users?id=${id}`, { method: "DELETE" })
      await fetchData()
    } catch (error) {
      console.error("Error deleting team member:", error)
    }
  }

  // Add column
  const handleAddColumn = async (name: string) => {
    try {
      await fetch("/api/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, position: columns.length }),
      })
      await fetchData()
    } catch (error) {
      console.error("Error adding column:", error)
    }
  }

  // Delete column
  const handleDeleteColumn = async (id: string) => {
    try {
      await fetch(`/api/columns?id=${id}`, { method: "DELETE" })
      await fetchData()
    } catch (error) {
      console.error("Error deleting column:", error)
    }
  }

  // Add task
  const handleAddTask = async (_columnId: string, task: { title: string; description: string; assignees: string[] }) => {
    try {
      const backlog = columns.find((c) => c.position === 0)
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...task,
          position: backlog?.tasks.length || 0,
        }),
      })
      await fetchData()
    } catch (error) {
      console.error("Error adding task:", error)
    }
  }

  // Update task
  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, ...updates }),
      })
      await fetchData()
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" })
      await fetchData()
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  // Move task
  const handleMoveTask = async (taskId: string, fromColumnId: string, toColumnId: string, newPosition?: number) => {
    try {
      const toColumn = columns.find((c) => c.id === toColumnId)
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          columnPosition: toColumn?.position ?? 0,
          position: newPosition !== undefined ? newPosition : toColumn?.tasks.length || 0,
        }),
      })
      await fetchData()
    } catch (error) {
      console.error("Error moving task:", error)
    }
  }

  // Add comment
  const handleAddComment = async (taskId: string, content: string, mentions: string[]) => {
    if (!currentUser) return
    try {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          authorUsername: currentUser.username,
          content,
        }),
      })
      await fetchData()
      await fetchNotifications()
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  // Edit comment
  const handleEditComment = async (taskId: string, commentId: string, content: string) => {
    try {
      await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: commentId, content }),
      })
      await fetchData()
    } catch (error) {
      console.error("Error editing comment:", error)
    }
  }

  // Mark notification as read
  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Toggle task completion (with subtask validation)
  const handleToggleComplete = async (taskId: string) => {
    const task = columns.flatMap(c => c.tasks).find(t => t.id === taskId)
    if (!task) return
    // Se está marcando como concluída, verificar subtasks pendentes
    if (!task.isComplete) {
      const ok = await checkSubtaskCompletion(taskId)
      if (!ok) {
        setPendingCloseTask({
          taskId,
          fromColumnId: "",
          toColumnId: "",
          isToggle: true,
        })
        return
      }
    }
    await doToggleComplete(taskId, !task.isComplete)
  }

  const doToggleComplete = async (taskId: string, complete: boolean) => {
    const task = columns.flatMap(c => c.tasks).find(t => t.id === taskId)
    if (!task) return
    setColumns(prev => prev.map(col => ({
      ...col,
      tasks: col.tasks.map(t => t.id === taskId ? { ...t, isComplete: complete } : t),
    })))
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, isComplete: complete }),
    })
  }

  // Clear all notifications
  const handleClearAllNotifications = async () => {
    if (!currentUser) return
    try {
      await fetch(`/api/notifications?userId=${currentUser.id}`, { method: "DELETE" })
      setNotifications([])
    } catch (error) {
      console.error("Error clearing notifications:", error)
    }
  }

  if (isLoading) {
    return <LoadingScreen message={loadingMessage} />
  }

  if (!currentUser) {
    return <><LoginScreen onLogin={handleLogin} isLoading={false} /><ToastContainer /></>
  }

  return (
    <>
      <KanbanBoard
        currentUser={currentUser}
        team={team}
        columns={columns}
        notifications={notifications}
        onLogout={handleLogout}
        onUpdateUser={handleUpdateUser}
        onAddTeamMember={handleAddTeamMember}
        onDeleteTeamMember={handleDeleteTeamMember}
        onAddColumn={handleAddColumn}
        onDeleteColumn={handleDeleteColumn}
        onAddTask={handleAddTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onMoveTask={handleMoveTask}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onMarkNotificationRead={handleMarkNotificationRead}
        onClearAllNotifications={handleClearAllNotifications}
        refreshData={fetchData}
        onReorderColumns={(cols) => setColumns(cols)}
        onToggleComplete={handleToggleComplete}
      />
      <ToastContainer />
    </>
  )
}

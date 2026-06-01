"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { showToast, ToastContainer } from "@/components/toast-notification"
import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor,
  PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent, type DragOverEvent,
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
  columnId: string
  position: number
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
  { name: "Branca", value: "#FFFFFF" },
  { name: "Cinza", value: "#6B7280" },
  { name: "Verde Limão", value: "#84CC16" },
  { name: "Verde Pistache", value: "#A3E635" },
  { name: "Laranja Forte", value: "#F97316" },
  { name: "Vermelho", value: "#EF4444" },
  { name: "Verde Folha", value: "#22C55E" },
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
}: {
  notifications: Notification[]
  onClose: () => void
  onMarkRead: (id: string) => void
  onClearAll: () => void
}) {
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

        <div className="flex-1 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="text-[#00FF66]/50 text-sm text-center py-8">
              {">"} NO_NOTIFICATIONS
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
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
}: {
  labels: Label[]
  onAdd: (label: Label) => void
  onRemove: (id: string) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].value)

  const handleAdd = () => {
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
          <div className="flex flex-wrap gap-2">
            {LABEL_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className={`w-8 h-8 border-2 transition-colors ${
                  selectedColor === color.value
                    ? "border-[#00FF66]"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
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

  useEffect(() => {
    fetch(`/api/subtasks?taskId=${task.id}`)
      .then((r) => r.json())
      .then((d) => setSubtasks(d.subtasks || []))
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
              <div className="text-[#00FF66] text-xs mb-2">{">"} DESCRIPTION:</div>
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

            <div className="text-[#00FF66]/50 text-xs">
              {">"} CREATED: {new Date(task.createdAt).toLocaleString("pt-BR")} | ID: {task.id.slice(0, 8)}...
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
      className="border border-[#262626] bg-[#1A1A1A] p-3 cursor-pointer hover:border-[#00FF66]/50 transition-colors"
    >
      <div {...attributes} {...listeners} className="text-[#00FF66]/30 text-xs mb-1 cursor-grab active:cursor-grabbing select-none">
        ⠿ {task.title ? "DRAG" : ""}
      </div>
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
        </div>
      )}

      <div className="text-white font-bold text-sm mb-2 break-words">{task.title}</div>
      {task.description && (
        <div className="text-white/70 text-xs mb-3 break-words line-clamp-2">{task.description}</div>
      )}

      <div className="text-[#00FF66] text-xs mb-3 flex flex-wrap gap-1">
        {task.assignees.map((assignee, i) => {
          const display = assignee.startsWith("@") ? assignee : `@${assignee.toLowerCase().replace(/\s+/g, "_")}`
          return <span key={i}>{display}{i < task.assignees.length - 1 ? "," : ""}</span>
        })}
      </div>

      {task.comments.length > 0 && (
        <div className="text-[#00FF66]/50 text-xs mb-3">[ {task.comments.length} COMMENT{task.comments.length > 1 ? "S" : ""} ]</div>
      )}
      {task.files && task.files.length > 0 && (
        <div className="text-[#00FF66]/50 text-xs mb-3">[ {task.files.length} FILE{task.files.length > 1 ? "S" : ""} ]</div>
      )}
      {task.subtaskCount !== undefined && task.subtaskCount > 0 && (
        <div className="text-[#00FF66]/50 text-xs mb-3">
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

// ==================== KANBAN COLUMN ====================
function KanbanColumn({
  column,
  columnIndex,
  totalColumns,
  team,
  onAddTask,
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
}: {
  column: Column
  columnIndex: number
  totalColumns: number
  team: TeamMember[]
  onAddTask: (task: { title: string; description: string; assignees: string[] }) => void
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
}) {
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  const taskIds = column.tasks.map((t) => t.id)

  return (
    <div className="flex-shrink-0 w-72 md:w-80 border border-[#262626] bg-black flex flex-col max-h-full">
      <div className="border-b border-[#262626] p-3 flex items-center justify-between bg-[#1A1A1A]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#00FF66] font-bold text-sm truncate">{column.name}</span>
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
            />
          ))}
        </SortableContext>

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
  return (
    <header className="border-b-2 border-[#00FF66] bg-black sticky top-0 z-40">
      <div className="px-3 py-3 md:px-6 md:py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-[#00FF66]">
            <span className="text-lg md:text-xl font-bold">BRO.LABS</span>
            <span className="text-[#00FF66]/50 text-xs md:text-sm">
              {"// BROLABTASK_CLI_v2.0"}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
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
        </div>
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
  const [pendingCloseTask, setPendingCloseTask] = useState<{ taskId: string; fromColumnId: string; toColumnId: string; newPosition?: number } | null>(null)
  const [cancelModalTask, setCancelModalTask] = useState<Task | null>(null)
  const [cancelReason, setCancelReason] = useState("")

  const allLabels: Label[] = columns.flatMap((c) => c.tasks.flatMap((t) => t.labels))
    .filter((l, i, arr) => arr.findIndex((x) => x.id === l.id) === i)

  const filteredColumns = columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((t) => {
      if (filterAssignee.length > 0 && !t.assignees.some((a) => filterAssignee.includes(a))) return false
      if (filterLabel.length > 0 && !t.labels.some((l) => filterLabel.includes(l.id))) return false
      return true
    }),
  }))

  const findColumnByTaskId = (taskId: string) =>
    columns.find((c) => c.tasks.some((t) => t.id === taskId))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
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
              Esta tarefa possui subtarefas que ainda não foram concluídas (APROVADO/FEITO). Deseja movê-la para FEITO mesmo assim?
            </div>
            <div className="flex gap-3">
              <button onClick={() => {
                if (pendingCloseTask) onMoveTask(pendingCloseTask.taskId, pendingCloseTask.fromColumnId, pendingCloseTask.toColumnId, pendingCloseTask.newPosition)
                setPendingCloseTask(null)
              }} className="flex-1 h-10 border border-[#FF3333] text-[#FF3333] text-xs hover:bg-[#FF3333] hover:text-black transition-colors">[ FORCAR_MOVER ]</button>
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

      <div className="flex-1 p-3 md:p-6 overflow-hidden">
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 flex-wrap">
          <div className="text-[#00FF66] text-sm whitespace-nowrap">{">"} BOARD_STATUS: SUPABASE_CONNECTED</div>
          <div className="text-[#00FF66]/50 text-xs whitespace-nowrap">COLUMNS: {columns.length} | TASKS: {columns.reduce((acc, col) => acc + col.tasks.length, 0)}</div>
          <div className="flex-1" />
          <select
            multiple
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(Array.from(e.target.selectedOptions, (o) => o.value))}
            className="h-8 max-w-[140px] bg-[#1A1A1A] border border-[#262626] text-[#00FF66] text-[10px] focus:border-[#00FF66] focus:outline-none"
          >
            {team.map((m) => (
              <option key={m.id} value={m.name}>{m.username}</option>
            ))}
          </select>
          <select
            multiple
            value={filterLabel}
            onChange={(e) => setFilterLabel(Array.from(e.target.selectedOptions, (o) => o.value))}
            className="h-8 max-w-[140px] bg-[#1A1A1A] border border-[#262626] text-[#00FF66] text-[10px] focus:border-[#00FF66] focus:outline-none"
          >
            {allLabels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          {(filterAssignee.length > 0 || filterLabel.length > 0) && (
            <button
              onClick={() => { setFilterAssignee([]); setFilterLabel([]) }}
              className="h-8 px-2 border border-[#FF3333]/50 text-[#FF3333] text-[10px] hover:border-[#FF3333] transition-colors"
            >CLEAR</button>
          )}
        </div>

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
                onAddTask={(task) => onAddTask(column.id, task)}
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
        <DragOverlay>
          {activeTask ? (
            <div className="border border-[#00FF66] bg-[#1A1A1A] p-3 opacity-80 w-72 md:w-80">
              <div className="text-white font-bold text-sm mb-2">{activeTask.task.title}</div>
              <div className="text-[#00FF66] text-xs">[ DRAGGING ]</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
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
        fetch("/api/columns"),
        fetch("/api/tasks"),
        fetch("/api/users"),
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
        tasks: tasksList.filter((t: Task) => t.columnId === col.id).sort((a: Task, b: Task) => a.position - b.position),
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
        const meRes = await fetch("/api/auth/me")
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
  const handleAddTask = async (columnId: string, task: { title: string; description: string; assignees: string[] }) => {
    try {
      const column = columns.find((c) => c.id === columnId)
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...task,
          columnId,
          position: column?.tasks.length || 0,
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
          columnId: toColumnId,
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
      />
      <ToastContainer />
    </>
  )
}

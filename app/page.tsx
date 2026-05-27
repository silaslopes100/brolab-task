"use client"

import { useState, useEffect, useRef } from "react"

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
  mentions: string[]
}

interface Task {
  id: string
  title: string
  description: string
  assignees: string[]
  labels: Label[]
  comments: Comment[]
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
  username: string
  role: string
  email: string
  password: string
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

// ==================== INITIAL DATA ====================
const initialAdminUsers: TeamMember[] = [
  {
    id: "admin-1",
    name: "ADMIN_GERAL",
    username: "admin",
    role: "SYSTEM_ADMIN",
    email: "admin@admin.com",
    password: "39754321",
    isAdmin: true,
  },
  {
    id: "admin-2",
    name: "SILAS_LOPES",
    username: "silas",
    role: "ADMIN",
    email: "silaslopesdesouza@gmail.com",
    password: "1234567",
    isAdmin: true,
  },
  {
    id: "admin-3",
    name: "MARCOS_SENA",
    username: "marcos",
    role: "ADMIN",
    email: "marcos.sena@cielo.com.br",
    password: "1234567",
    isAdmin: true,
  },
]

const initialColumns: Column[] = [
  { id: "backlog", title: "BACKLOG", tasks: [] },
  { id: "fazendo", title: "FAZENDO", tasks: [] },
  { id: "alteracoes", title: "ALTERAÇÕES", tasks: [] },
  { id: "aprovado", title: "APROVADO", tasks: [] },
  { id: "feito", title: "FEITO", tasks: [] },
]

// ==================== LOGIN SCREEN ====================
function LoginScreen({
  onLogin,
  users,
}: {
  onLogin: (user: TeamMember) => void
  users: TeamMember[]
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    setError("")
    setIsLoading(true)

    setTimeout(() => {
      const user = users.find(
        (u) =>
          (u.email.toLowerCase() === email.toLowerCase() ||
            u.username.toLowerCase() === email.toLowerCase().replace("@", "")) &&
          u.password === password
      )

      if (user) {
        onLogin(user)
      } else {
        setError("ERRO: CREDENCIAIS_INVÁLIDAS")
        setIsLoading(false)
      }
    }, 600)
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
            {">"} CONNECTION: ENCRYPTED
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
          disabled={isLoading || !email || !password}
          className="w-full h-14 border-2 border-[#00FF66] bg-black text-[#00FF66] font-mono text-sm hover:bg-[#00FF66] hover:text-black transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-pulse">{">"}</span>
              AUTHENTICATING...
            </span>
          ) : (
            "[ LOGIN ]"
          )}
        </button>

        <div className="mt-6 text-center text-[#00FF66]/30 text-xs">
          BROLABTASK_CLI_v2.0 © BRO.LABS
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
  onSave: (updates: Partial<TeamMember>) => void
}) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [password, setPassword] = useState("")
  const [role, setRole] = useState(user.role)

  const handleSave = () => {
    const updates: Partial<TeamMember> = {
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
  onAddMember: (member: TeamMember) => void
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
        id: Date.now().toString(),
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
    <div className="relative">
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

// ==================== TASK EDIT MODAL ====================
function TaskEditModal({
  task,
  team,
  currentUser,
  onClose,
  onSave,
  onAddComment,
}: {
  task: Task
  team: TeamMember[]
  currentUser: TeamMember
  onClose: () => void
  onSave: (updates: Partial<Task>) => void
  onAddComment: (comment: Comment) => void
}) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [assignees, setAssignees] = useState<string[]>(task.assignees)
  const [labels, setLabels] = useState<Label[]>(task.labels)
  const [newComment, setNewComment] = useState("")

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
      const comment: Comment = {
        id: Date.now().toString(),
        authorId: currentUser.id,
        authorName: currentUser.name,
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        mentions,
      }
      onAddComment(comment)
      setNewComment("")
    }
  }

  const toggleAssignee = (name: string) => {
    if (assignees.includes(name)) {
      setAssignees(assignees.filter((a) => a !== name))
    } else {
      setAssignees([...assignees, name])
    }
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
            {/* Title */}
            <div>
              <div className="text-[#00FF66] text-xs mb-2">{">"} TITLE:</div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 px-3 bg-[#1A1A1A] border border-[#262626] text-white text-base focus:border-[#00FF66] focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <div className="text-[#00FF66] text-xs mb-2">{">"} DESCRIPTION:</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#262626] text-white text-base focus:border-[#00FF66] focus:outline-none resize-none"
              />
            </div>

            {/* Assignees */}
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

            {/* Labels */}
            <LabelManager
              labels={labels}
              onAdd={(label) => setLabels([...labels, label])}
              onRemove={(id) => setLabels(labels.filter((l) => l.id !== id))}
            />

            {/* Comments */}
            <div className="border border-[#262626] p-3">
              <div className="text-[#00FF66] text-xs mb-3">{">"} COMMENT_HISTORY:</div>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {task.comments.length === 0 ? (
                  <div className="text-[#00FF66]/50 text-xs">NO_COMMENTS</div>
                ) : (
                  task.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border border-[#262626] bg-[#1A1A1A] p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#00FF66] text-xs font-bold">
                          @{team.find((t) => t.id === comment.authorId)?.username || "unknown"}
                        </span>
                        <span className="text-[#00FF66]/50 text-xs">
                          {new Date(comment.createdAt).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="text-white text-sm break-words">
                        {comment.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="text-[#00FF66] text-xs mb-2">{">"} NEW_COMMENT (use @ para mencionar):</div>
              <MentionInput
                value={newComment}
                onChange={setNewComment}
                onSubmit={handleAddComment}
                team={team}
                placeholder="Digite seu comentário..."
              />
            </div>

            <div className="text-[#00FF66]/50 text-xs">
              {">"} CREATED: {new Date(task.createdAt).toLocaleString("pt-BR")} | ID: {task.id}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== TASK CARD ====================
function TaskCard({
  task,
  columnIndex,
  taskIndex,
  totalColumns,
  totalTasks,
  onMove,
  onMoveVertical,
  onDelete,
  onEdit,
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
}) {
  return (
    <div
      onClick={onEdit}
      className="border border-[#262626] bg-[#1A1A1A] p-3 cursor-pointer hover:border-[#00FF66]/50 transition-colors"
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
        </div>
      )}

      <div className="text-white font-bold text-sm mb-2 break-words">
        {task.title}
      </div>
      {task.description && (
        <div className="text-white/70 text-xs mb-3 break-words line-clamp-2">
          {task.description}
        </div>
      )}

      {/* Assignees */}
      <div className="text-[#00FF66] text-xs mb-3 flex flex-wrap gap-1">
        {task.assignees.map((assignee, i) => (
          <span key={i}>@{assignee}{i < task.assignees.length - 1 ? "," : ""}</span>
        ))}
      </div>

      {/* Comments count */}
      {task.comments.length > 0 && (
        <div className="text-[#00FF66]/50 text-xs mb-3">
          [ {task.comments.length} COMMENT{task.comments.length > 1 ? "S" : ""} ]
        </div>
      )}

      <div className="flex gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
        {/* Vertical movement */}
        <div className="flex flex-col gap-1 mr-1">
          <button
            onClick={() => onMoveVertical("up")}
            disabled={taskIndex === 0}
            className="h-6 w-6 border border-[#262626] text-[#00FF66] text-xs hover:border-[#00FF66] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          >
            ▲
          </button>
          <button
            onClick={() => onMoveVertical("down")}
            disabled={taskIndex === totalTasks - 1}
            className="h-6 w-6 border border-[#262626] text-[#00FF66] text-xs hover:border-[#00FF66] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          >
            ▼
          </button>
        </div>

        {/* Horizontal movement */}
        {columnIndex > 0 && (
          <button
            onClick={() => onMove("left")}
            className="h-8 px-2 border border-[#262626] text-[#00FF66] text-xs hover:border-[#00FF66] transition-colors"
          >
            ←
          </button>
        )}
        {columnIndex < totalColumns - 1 && (
          <button
            onClick={() => onMove("right")}
            className="h-8 px-2 border border-[#262626] text-[#00FF66] text-xs hover:border-[#00FF66] transition-colors"
          >
            →
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

// ==================== NEW TASK FORM ====================
function NewTaskForm({
  team,
  onSubmit,
  onCancel,
}: {
  team: TeamMember[]
  onSubmit: (task: Omit<Task, "id" | "createdAt" | "comments">) => void
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
        labels: [],
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
  currentUser,
  onAddTask,
  onMoveTask,
  onMoveTaskVertical,
  onDeleteTask,
  onDeleteColumn,
  onEditTask,
  isDefault,
}: {
  column: Column
  columnIndex: number
  totalColumns: number
  team: TeamMember[]
  currentUser: TeamMember
  onAddTask: (task: Omit<Task, "id" | "createdAt" | "comments">) => void
  onMoveTask: (taskId: string, direction: "left" | "right") => void
  onMoveTaskVertical: (taskId: string, direction: "up" | "down") => void
  onDeleteTask: (taskId: string) => void
  onDeleteColumn: () => void
  onEditTask: (task: Task) => void
  isDefault: boolean
}) {
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)

  return (
    <div className="flex-shrink-0 w-72 md:w-80 border border-[#262626] bg-black flex flex-col max-h-full">
      <div className="border-b border-[#262626] p-3 flex items-center justify-between bg-[#1A1A1A]">
        <div className="flex items-center gap-2">
          <span className="text-[#00FF66] font-bold text-sm">{column.title}</span>
          <span className="text-[#00FF66]/50 text-xs">[{column.tasks.length}]</span>
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
        {column.tasks.map((task, taskIndex) => (
          <TaskCard
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

// ==================== MAIN BOARD ====================
function KanbanBoard({
  currentUser,
  team,
  setTeam,
  onLogout,
  onUpdateUser,
}: {
  currentUser: TeamMember
  team: TeamMember[]
  setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>
  onLogout: () => void
  onUpdateUser: (updates: Partial<TeamMember>) => void
}) {
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showNewColumnForm, setShowNewColumnForm] = useState(false)
  const [editingTask, setEditingTask] = useState<{
    task: Task
    columnId: string
  } | null>(null)

  const defaultColumnIds = [
    "backlog",
    "fazendo",
    "alteracoes",
    "aprovado",
    "feito",
  ]

  const addNotification = (
    type: Notification["type"],
    message: string,
    taskId: string,
    taskTitle: string,
    fromUser: string,
    targetUserId: string
  ) => {
    if (targetUserId !== currentUser.id) {
      const newNotif: Notification = {
        id: Date.now().toString(),
        type,
        message,
        taskId,
        taskTitle,
        fromUser,
        createdAt: new Date().toISOString(),
        read: false,
      }
      setNotifications((prev) => [newNotif, ...prev])
    }
  }

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

  const addTask = (
    columnId: string,
    taskData: Omit<Task, "id" | "createdAt" | "comments">
  ) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      comments: [],
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

  const moveTaskVertical = (
    columnId: string,
    taskId: string,
    direction: "up" | "down"
  ) => {
    setColumns(
      columns.map((col) => {
        if (col.id !== columnId) return col

        const taskIndex = col.tasks.findIndex((t) => t.id === taskId)
        if (taskIndex === -1) return col

        const newIndex = direction === "up" ? taskIndex - 1 : taskIndex + 1
        if (newIndex < 0 || newIndex >= col.tasks.length) return col

        const newTasks = [...col.tasks]
        const [task] = newTasks.splice(taskIndex, 1)
        newTasks.splice(newIndex, 0, task)

        return { ...col, tasks: newTasks }
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

  const updateTask = (columnId: string, taskId: string, updates: Partial<Task>) => {
    setColumns(
      columns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              tasks: col.tasks.map((t) =>
                t.id === taskId ? { ...t, ...updates } : t
              ),
            }
          : col
      )
    )
  }

  const addComment = (columnId: string, taskId: string, comment: Comment) => {
    const task = columns
      .find((c) => c.id === columnId)
      ?.tasks.find((t) => t.id === taskId)

    if (task && comment.mentions.length > 0) {
      comment.mentions.forEach((username) => {
        const mentionedUser = team.find(
          (m) => m.username.toLowerCase() === username
        )
        if (mentionedUser) {
          addNotification(
            "mention",
            `@${currentUser.username} mencionou você na tarefa "${task.title}"`,
            taskId,
            task.title,
            currentUser.name,
            mentionedUser.id
          )
        }
      })
    }

    setColumns(
      columns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              tasks: col.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, comments: [...t.comments, comment] }
                  : t
              ),
            }
          : col
      )
    )
  }

  const addTeamMember = (member: TeamMember) => {
    setTeam([...team, member])
  }

  const deleteTeamMember = (id: string) => {
    setTeam(team.filter((m) => m.id !== id))
  }

  const markNotificationRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const clearAllNotifications = () => {
    setNotifications([])
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
          onMarkRead={markNotificationRead}
          onClearAll={clearAllNotifications}
        />
      )}

      {showTeamModal && (
        <TeamAdminModal
          team={team}
          currentUser={currentUser}
          onClose={() => setShowTeamModal(false)}
          onAddMember={addTeamMember}
          onDeleteMember={deleteTeamMember}
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
          onClose={() => setEditingTask(null)}
          onSave={(updates) =>
            updateTask(editingTask.columnId, editingTask.task.id, updates)
          }
          onAddComment={(comment) =>
            addComment(editingTask.columnId, editingTask.task.id, comment)
          }
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
              currentUser={currentUser}
              onAddTask={(task) => addTask(column.id, task)}
              onMoveTask={(taskId, direction) =>
                moveTask(column.id, taskId, direction)
              }
              onMoveTaskVertical={(taskId, direction) =>
                moveTaskVertical(column.id, taskId, direction)
              }
              onDeleteTask={(taskId) => deleteTask(column.id, taskId)}
              onDeleteColumn={() => deleteColumn(column.id)}
              onEditTask={(task) =>
                setEditingTask({ task, columnId: column.id })
              }
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
          BROLABTASK_CLI_v2.0 © BRO.LABS | SESSION_ACTIVE |{" "}
          {new Date().toLocaleTimeString("pt-BR")}
        </span>
      </footer>
    </div>
  )
}

// ==================== MAIN APP ====================
export default function BroLabTask() {
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null)
  const [team, setTeam] = useState<TeamMember[]>(initialAdminUsers)

  const handleLogin = (user: TeamMember) => {
    setCurrentUser(user)
  }

  const handleLogout = () => {
    setCurrentUser(null)
  }

  const handleUpdateUser = (updates: Partial<TeamMember>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates }
      setCurrentUser(updatedUser)
      setTeam(team.map((m) => (m.id === currentUser.id ? updatedUser : m)))
    }
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} users={team} />
  }

  return (
    <KanbanBoard
      currentUser={currentUser}
      team={team}
      setTeam={setTeam}
      onLogout={handleLogout}
      onUpdateUser={handleUpdateUser}
    />
  )
}

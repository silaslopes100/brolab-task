"use client"

import { useState, useEffect, useRef, useCallback } from "react"

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
  createdAt: string
  is_completed?: boolean
  is_archived?: boolean
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
const LABEL_COLORS: Record<string, string> = {
  Branca: "bg-white text-black",
  Cinza: "bg-neutral-500 text-white",
  "Verde Limão": "bg-lime-400 text-black",
  "Verde Pistache": "bg-emerald-300 text-black",
  "Laranja Forte": "bg-orange-600 text-white",
  Vermelho: "bg-red-600 text-white",
  "Verde Folha": "bg-green-700 text-white",
};

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
  return (
    <span className={`px-2 py-0.5 text-xs font-bold ${LABEL_COLORS[label.name] || 'bg-gray-500 text-white'}`}>{label.name}</span>
  );
}

// ==================== LABEL MANAGER ====================
function LabelManager({
  labels,
  onAdd,
  onRemove,
  allLabels,
}: {
  labels: Label[]
  onAdd: (label: Label) => void
  onRemove: (id: string) => void
  allLabels: Label[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [selectedColor, setSelectedColor] = useState(Object.values(LABEL_COLORS)[0])
  const [showExisting, setShowExisting] = useState(false)

  const uniqueExistingLabels = allLabels.filter(
    (al) => !labels.some((l) => l.name === al.name)
  )

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd({
        id: Date.now().toString(),
        name: newName.trim().toUpperCase(),
        color: selectedColor,
      })
      setNewName("")
      setSelectedColor(Object.values(LABEL_COLORS)[0])
      setShowForm(false)
    }
  }

  const handleAddExisting = (label: Label) => {
    if (!labels.some((l) => l.name === label.name)) {
      onAdd({ ...label, id: Date.now().toString() })
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
        <div className="space-y-2">
          <button
            onClick={() => { setShowForm(true); setShowExisting(false); }}
            className="w-full h-10 border border-dashed border-[#262626] text-[#00FF66]/50 text-xs hover:border-[#00FF66] hover:text-[#00FF66] transition-colors"
          >
            [ + ADD_LABEL ]
          </button>
          {uniqueExistingLabels.length > 0 && (
            <>
              <button
                onClick={() => setShowExisting(!showExisting)}
                className="w-full h-8 border border-dashed border-[#262626] text-[#00FF66]/30 text-xs hover:border-[#00FF66] hover:text-[#00FF66] transition-colors"
              >
                {showExisting ? "[ - OCULTAR_EXISTENTES ]" : `[ CARREGAR_EXISTENTES (${uniqueExistingLabels.length}) ]`}
              </button>
              {showExisting && (
                <div className="flex flex-wrap gap-2 p-2 border border-[#262626]">
                  {uniqueExistingLabels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => handleAddExisting(label)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <LabelBadge label={label} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
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
{Object.entries(LABEL_COLORS).map(([name, className]) => (
  <button
    key={name}
    onClick={() => setSelectedColor(className)}
    className={`w-8 h-8 border-2 transition-colors ${
      selectedColor === className ? "border-[#00FF66]" : "border-transparent"
    } ${className}`}
    title={name}
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
  onComplete,
  onArchive,
  allLabels,
}: {
  task: Task
  team: TeamMember[]
  currentUser: TeamMember
  onClose: () => void
  onSave: (updates: Partial<Task>) => void
  onAddComment: (content: string, mentions: string[]) => void
  onComplete?: () => void
  onArchive?: () => void
  allLabels: Label[]
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
      onAddComment(newComment.trim(), mentions)
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

// AI enhancement state and handler
const [isProcessingAI, setIsProcessingAI] = useState(false);
const handleAIEnhance = async () => {
  if (!description.trim()) return;
  setIsProcessingAI(true);
  try {
    const res = await fetch('/api/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: description }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.enhanced) {
        setDescription(data.enhanced);
      }
    }
  } catch (e) {
    console.error('AI enhance failed', e);
  } finally {
    setIsProcessingAI(false);
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
  <button
    onClick={() => { onComplete?.(); onClose(); }}
    disabled={!!task.is_completed}
    className="text-[#00FF66] hover:bg-[#00FF66] hover:text-black px-2 py-1 border border-[#00FF66] transition-colors text-xs disabled:opacity-30"
  >
    {task.is_completed ? "[ CONCLUIDO ]" : "[ CONCLUIR TAREFA ]"}
  </button>
  <button
    onClick={() => { onArchive?.(); onClose(); }}
    disabled={!!task.is_archived}
    className="text-[#00FF66] hover:bg-[#00FF66] hover:text-black px-2 py-1 border border-[#00FF66] transition-colors text-xs disabled:opacity-30"
  >
    {task.is_archived ? "[ ARQUIVADO ]" : "[ ARQUIVAR TAREFA ]"}
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
<button
  onClick={handleAIEnhance}
  disabled={isProcessingAI}
  className="mt-2 w-full h-10 border border-[#00FF66] text-[#00FF66] text-xs hover:bg-[#00FF66] hover:text-black transition-colors disabled:opacity-50"
>
  {isProcessingAI ? "[ ✨ PROCESSING_AI... ]" : "[ ✨ AI_ENHANCE ]"}
</button>
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
              allLabels={allLabels}
            />

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
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00FF66] text-xs hover:underline truncate flex-1"
                      >
                        {file.name}
                      </a>
                      <span className="text-[#00FF66]/50 text-xs ml-2 shrink-0">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-[#262626] hover:border-[#00FF66] p-3 transition-colors">
                <span className="text-[#00FF66] text-xs">[ UPLOAD_FILE ]</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const formData = new FormData()
                    formData.append("file", file)
                    formData.append("taskId", task.id)
                    try {
                      const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                      })
                      if (res.ok) {
                        window.location.reload()
                      }
                    } catch (err) {
                      console.error("Upload failed:", err)
                    }
                  }}
                />
              </label>
            </div>

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
                            {comment.authorName}
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
              {">"} CREATED: {new Date(task.createdAt).toLocaleString("pt-BR")} | ID: {task.id.slice(0, 8)}...
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
      className={`border border-[#262626] p-3 cursor-pointer hover:border-[#00FF66]/50 transition-colors ${task.is_completed ? 'bg-[#00FF66] text-black font-bold' : 'bg-[#1A1A1A] text-white'}` }
    >
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
        </div>
      )}

      <div className={`text-${task.is_completed ? 'black' : 'white'} font-bold text-sm mb-2 break-words`}>
        {task.title}
      </div>
      {task.description && (
        <div className={`text-${task.is_completed ? 'black' : 'white'}/70 text-xs mb-3 break-words line-clamp-2`}>
          {task.description}
        </div>
      )}

                      <div className="text-[#00FF66] text-xs mb-3 flex flex-wrap gap-1">
        {task.assignees.map((assignee, i) => {
          const display = assignee.startsWith("@") ? assignee : `@${assignee.toLowerCase().replace(/\s+/g, "_")}`
          return <span key={i}>{display}{i < task.assignees.length - 1 ? "," : ""}</span>
        })}
      </div>

      {task.comments.length > 0 && (
        <div className="text-[#00FF66]/50 text-xs mb-3">
          [ {task.comments.length} COMMENT{task.comments.length > 1 ? "S" : ""} ]
        </div>
      )}
      {task.files && task.files.length > 0 && (
        <div className="text-[#00FF66]/50 text-xs mb-3">
          [ {task.files.length} FILE{task.files.length > 1 ? "S" : ""} ]
        </div>
      )}

      <div className="flex gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
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
  isDefault,
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
  isDefault: boolean
}) {
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)

  return (
    <div className="flex-shrink-0 w-72 md:w-80 border border-[#262626] bg-black flex flex-col max-h-full">
      <div className="border-b border-[#262626] p-3 flex items-center justify-between bg-[#1A1A1A]">
        <div className="flex items-center gap-2">
          <span className="text-[#00FF66] font-bold text-sm">{column.name}</span>
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
  onCompleteTask,
  onArchiveTask,
  refreshData,
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
  onMarkNotificationRead: (id: string) => void
  onClearAllNotifications: () => void
  onCompleteTask: (taskId: string) => void
  onArchiveTask: (taskId: string) => void
  refreshData: () => void
}) {
  const [showTeamModal, setShowTeamModal] = useState(false);
const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
const [showArchived, setShowArchived] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showNewColumnForm, setShowNewColumnForm] = useState(false)
  const [editingTask, setEditingTask] = useState<{
    task: Task
    columnId: string
  } | null>(null)

  const handleMoveTask = (columnId: string, taskId: string, direction: "left" | "right") => {
    const columnIndex = columns.findIndex((c) => c.id === columnId)
    const toIndex = direction === "left" ? columnIndex - 1 : columnIndex + 1
    if (toIndex < 0 || toIndex >= columns.length) return
    const toColumnId = columns[toIndex].id
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

<<<<<<< HEAD
  const allLabels = columns.flatMap((col) => col.tasks.flatMap((t) => t.labels)).filter(
    (label, index, self) => self.findIndex((l) => l.name === label.name) === index
  )

  const visibleColumns = columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((t) => !t.is_archived),
  }))

  const activeTasksCount = visibleColumns.reduce((acc, col) => acc + col.tasks.length, 0)
=======
  const handleColumnMove = (columnId: string, direction: "left" | "right") => {
    const idx = columns.findIndex((c) => c.id === columnId)
    if (idx === -1) return
    const targetIdx = direction === "left" ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= columns.length) return
    const reordered = [...columns]
    ;[reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]]
    reordered.forEach((c, i) => { c.position = i })
    setColumns(reordered)
    fetch(`/api/columns/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columns: reordered.map((c, i) => ({ id: c.id, position: i })) }),
    }).catch(console.error)
  }
>>>>>>> parent of 6786381 (renomear função de middleware para proxy e ajustar lógica de autenticação)

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
          onComplete={() => onCompleteTask(editingTask.task.id)}
          onArchive={() => onArchiveTask(editingTask.task.id)}
          allLabels={allLabels}
        />
      )}

      <div className="flex-1 p-3 md:p-6 overflow-hidden">
        <div className="flex items-center gap-4 mb-4 overflow-x-auto pb-2">
          <div className="text-[#00FF66] text-sm whitespace-nowrap">
            {">"} BOARD_STATUS: SUPABASE_CONNECTED
          </div>
          <div className="text-[#00FF66]/50 text-xs whitespace-nowrap">
            COLUMNS: {columns.length} | TASKS:{" "}
            {activeTasksCount}
          </div>
          <button
            onClick={() => setViewMode(viewMode === "kanban" ? "list" : "kanban")}
            className={`h-8 px-3 border text-xs transition-colors whitespace-nowrap ${
              viewMode === "list"
                ? "border-[#00FF66] bg-[#00FF66] text-black"
                : "border-[#262626] text-[#00FF66]/50 hover:border-[#00FF66] hover:text-[#00FF66]"
            }`}
          >
            [ {viewMode === "kanban" ? "MODO_LISTA" : "MODO_KANBAN"} ]
          </button>
        </div>

        {viewMode === "kanban" ? (
          <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] md:h-[calc(100vh-180px)]">
            {visibleColumns.map((column, index) => (
              <KanbanColumn
                key={column.id}
                column={column}
                columnIndex={index}
                totalColumns={visibleColumns.length}
                team={team}
                onAddTask={(task) => onAddTask(column.id, task)}
                onMoveTask={(taskId, direction) => handleMoveTask(column.id, taskId, direction)}
                onMoveTaskVertical={(taskId, direction) => handleMoveTaskVertical(column.id, taskId, direction)}
                onDeleteTask={(taskId) => onDeleteTask(taskId)}
                onDeleteColumn={() => onDeleteColumn(column.id)}
                onEditTask={(task) => setEditingTask({ task, columnId: column.id })}
                isDefault={DEFAULT_COLUMN_NAMES.includes(column.name)}
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
        ) : (
          <div className="overflow-x-auto pb-4 h-[calc(100vh-200px)] md:h-[calc(100vh-180px)]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#262626]">
                  <th className="text-left text-[#00FF66] text-xs p-2 font-bold">TAREFA</th>
                  <th className="text-left text-[#00FF66] text-xs p-2 font-bold">COLUNA</th>
                  <th className="text-left text-[#00FF66] text-xs p-2 font-bold">RESPONSAVEIS</th>
                  <th className="text-left text-[#00FF66] text-xs p-2 font-bold">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {visibleColumns.flatMap((col) =>
                  col.tasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => setEditingTask({ task, columnId: col.id })}
                      className={`border-b border-[#1A1A1A] cursor-pointer hover:bg-[#1A1A1A] transition-colors ${
                        task.is_completed ? "bg-[#00FF66]/10" : ""
                      }`}
                    >
                      <td className="p-2 text-white text-sm">{task.title}</td>
                      <td className="p-2 text-[#00FF66] text-xs">{col.name}</td>
                      <td className="p-2 text-[#00FF66]/50 text-xs">
                        {task.assignees.map((a) => `@${a}`).join(", ")}
                      </td>
                      <td className="p-2 text-xs">
                        {task.is_completed ? (
                          <span className="text-[#00FF66]">CONCLUIDO</span>
                        ) : (
                          <span className="text-yellow-500">PENDENTE</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {activeTasksCount === 0 && (
              <div className="text-center text-[#00FF66]/30 text-sm py-8">
                {">"} NENHUMA_TAREFA_ENCONTRADA
              </div>
            )}
          </div>
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

  // Initial load
  useEffect(() => {
    const init = async () => {
<<<<<<< HEAD
=======
      setLoadingMessage("RESTORING_SESSION...")
      try {
        const meRes = await fetch("/api/auth/me")
        if (meRes.ok) {
          const meData = await meRes.json()
          setCurrentUser(meData.user)
        }
      } catch { /* no session */ }
      if (!currentUser) {
        setIsLoading(false)
        return
      }
>>>>>>> parent of 6786381 (renomear função de middleware para proxy e ajustar lógica de autenticação)
      setLoadingMessage("CONNECTING_TO_SUPABASE...")
      await fetchData()
      setLoadingMessage("SYSTEM_READY")
      setIsLoading(false)
    }
    init()
  }, [fetchData])

  // Fetch notifications when user logs in
  useEffect(() => {
    if (currentUser) {
      fetchNotifications()
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
  }

  // Logout handler
  const handleLogout = () => {
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

  // Complete task
  const handleCompleteTask = async (taskId: string) => {
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, is_completed: true }),
      })
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) =>
            t.id === taskId ? { ...t, is_completed: true } : t
          ),
        }))
      )
    } catch (error) {
      console.error("Error completing task:", error)
    }
  }

  // Archive task
  const handleArchiveTask = async (taskId: string) => {
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, is_archived: true }),
      })
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) =>
            t.id === taskId ? { ...t, is_archived: true } : t
          ),
        }))
      )
    } catch (error) {
      console.error("Error archiving task:", error)
    }
  }

  if (isLoading) {
    return <LoadingScreen message={loadingMessage} />
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} isLoading={false} />
  }

  return (
<<<<<<< HEAD
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
      onMarkNotificationRead={handleMarkNotificationRead}
      onClearAllNotifications={handleClearAllNotifications}
      onCompleteTask={handleCompleteTask}
      onArchiveTask={handleArchiveTask}
      refreshData={fetchData}
    />
=======
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
      />
      <ToastContainer />
    </>
>>>>>>> parent of 6786381 (renomear função de middleware para proxy e ajustar lógica de autenticação)
  )
}

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { showToast, ToastContainer } from "@/components/toast-notification"
import { DEFAULT_WORKSPACE_ID } from "@/lib/labels"
import { useTheme, type ThemeName } from "@/components/theme-provider"
import { generateTelegramCode, clearTelegramCode, unlinkTelegram } from "@/lib/notifications"
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
  assigneeId: string | null
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

interface BoardSubtask {
  id: string
  title: string
  status: string
  position: number
  assigneeId: string | null
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
  assigneeId?: string | null
  coverImageUrl?: string | null
  labels: Label[]
  comments: Comment[]
  files: TaskFile[]
  subtaskCount?: number
  subtasks?: BoardSubtask[]
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
  avatarUrl?: string | null
  emailNotificationsEnabled?: boolean
  telegramNotificationsEnabled?: boolean
  telegramChatId?: string | null
  telegramVerificationCode?: string | null
}

interface Notification {
  id: string
  type: "mention" | "assignment" | "comment"
  message: string
  taskId: string
  boardId?: string | null
  subtaskId?: string | null
  taskTitle: string
  fromUser: string
  createdAt: string
  read: boolean
}

// ==================== LABEL COLORS ====================
const LABEL_COLORS = [
  { name: "Vermelho", value: "#f04444" },
  { name: "Laranja", value: "#ff8844" },
  { name: "Amarelo", value: "#ffcc00" },
  { name: "Verde", value: "#00dd77" },
  { name: "Verde escuro", value: "#00aa55" },
  { name: "Ciano", value: "#00ccff" },
  { name: "Azul", value: "#4488ff" },
  { name: "Roxo", value: "#aa44ff" },
  { name: "Rosa", value: "#ff44aa" },
  { name: "Cinza", value: "#8e8e8e" },
  { name: "Branco", value: "#fafafa" },
  { name: "Preto", value: "#3f3f3f" },
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
    <div className="min-h-screen bg-[var(--br-bg)] flex items-center justify-center p-4">
      <div className="border-2 border-[var(--br-accent)] p-6 md:p-10 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-[var(--br-accent)] text-2xl md:text-3xl font-bold mb-2">
            BRO.LABS
          </div>
          <div className="text-[var(--br-accent)]/70 text-sm">{"// AUTH_REQUIRED"}</div>
        </div>

        <div className="border border-[var(--br-border)] p-4 mb-6">
          <div className="text-[var(--br-accent)]/50 text-xs mb-2">
            {">"} SYSTEM_STATUS: SECURE
          </div>
          <div className="text-[var(--br-accent)]/50 text-xs mb-2">
            {">"} CONNECTION: SUPABASE_ENCRYPTED
          </div>
          <div className="text-[var(--br-accent)]/50 text-xs">
            {">"} AWAITING_CREDENTIALS...
            <span className="animate-pulse">_</span>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <div className="text-[var(--br-accent)] text-xs mb-2">
              {">"} EMAIL / USERNAME:
            </div>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@domain.com ou @username"
              className="w-full h-14 px-4 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none"
            />
          </div>
          <div>
            <div className="text-[var(--br-accent)] text-xs mb-2">{">"} PASSWORD:</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full h-14 px-4 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
        </div>

        {error && (
          <div className="border border-[var(--br-danger)] bg-[var(--br-danger)]/10 p-3 mb-4 text-[var(--br-danger)] text-xs">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading || externalLoading || !email || !password}
          className="w-full h-14 border-2 border-[var(--br-accent)] bg-[var(--br-bg)] text-[var(--br-accent)] font-mono text-sm hover:bg-[var(--br-accent)] hover:text-black transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="mt-6 text-center text-[var(--br-accent)]/30 text-xs">
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
      className="relative h-10 px-3 border border-[var(--br-border)] text-[var(--br-accent)] text-sm hover:border-[var(--br-accent)] transition-colors"
    >
      [ NOTIF ]
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--br-danger)] text-black text-xs flex items-center justify-center animate-pulse">
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

  const handleOpenNotification = async (notif: Notification) => {
    if (!notif.taskId) {
      onMarkRead(notif.id)
      return
    }
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif.id, isRead: true }),
      })
    } catch {
      // segue para a navegação mesmo assim
    }
    const boardId = notif.boardId || DEFAULT_WORKSPACE_ID
    const url = `/board/${boardId}/task/${notif.taskId}${notif.subtaskId ? `?subtask=${notif.subtaskId}` : ""}`
    window.location.href = url
  }

  const filtered = notifications.filter((n) => {
    if (filterUser === "all") return true
    if (filterUser === "mine") return n.fromUser === ""
    return n.fromUser === filterUser
  })

  return (
    <div className="fixed inset-0 bg-[var(--br-overlay)] z-50 flex items-center justify-center p-4">
      <div className="border-2 border-[var(--br-accent)] bg-[var(--br-bg)] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-[var(--br-accent)] p-4 flex justify-between items-center">
          <span className="text-[var(--br-accent)] font-bold">{">"} NOTIFICATIONS</span>
          <div className="flex gap-2">
            <button
              onClick={onClearAll}
              className="text-[var(--br-accent)]/50 hover:text-[var(--br-accent)] text-xs px-2 py-1 border border-[var(--br-border)] hover:border-[var(--br-accent)] transition-colors"
            >
              [ CLEAR_ALL ]
            </button>
            <button
              onClick={onClose}
              className="text-[var(--br-danger)] hover:bg-[var(--br-danger)] hover:text-black px-2 py-1 border border-[var(--br-danger)] transition-colors text-xs"
            >
              [ CLOSE ]
            </button>
          </div>
        </div>

        <div className="border-b border-[var(--br-border)] px-4 py-2 flex items-center gap-2">
          <span className="text-[var(--br-accent)]/50 text-xs">FILTRO:</span>
          <select
            value={filterUser}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="flex-1 h-8 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-accent)] text-xs focus:border-[var(--br-accent)] focus:outline-none"
          >
            <option value="all">Todos</option>
            <option value="mine">Apenas minhas</option>
            {team?.map((m) => (
              <option key={m.id} value={m.username}>{m.username}</option>
            ))}
          </select>
          <span className="text-[var(--br-text-secondary)] text-xs">{filtered.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="text-[var(--br-accent)]/50 text-sm text-center py-8">
              {">"} NO_NOTIFICATIONS
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleOpenNotification(notif)}
                  title={notif.taskId ? "Abrir tarefa" : undefined}
                  className={`border p-3 cursor-pointer transition-colors ${
                    notif.read
                      ? "border-[var(--br-border)] bg-[var(--br-bg-secondary)] hover:border-[var(--br-accent)]/50"
                      : "border-[var(--br-accent)] bg-[var(--br-accent)]/5 hover:bg-[var(--br-accent)]/10"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notif.read && (
                      <span className="w-2 h-2 bg-[var(--br-accent)] mt-1.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[var(--br-text)] text-sm break-words">
                        {notif.message}
                      </div>
                      <div className="text-[var(--br-accent)]/50 text-xs mt-1">
                        {notif.fromUser && <span>@{notif.fromUser} | </span>}
                        {notif.subtaskId && <span className="text-[var(--br-warn)]">SUBTAREFA | </span>}
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
  onAvatarUpdated,
}: {
  user: TeamMember
  onClose: () => void
  onSave: (updates: Partial<TeamMember> & { password?: string }) => void
  onAvatarUpdated?: (avatarUrl: string) => void
}) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [password, setPassword] = useState("")
  const [role, setRole] = useState(user.role)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null)
  const [uploading, setUploading] = useState(false)

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotificationsEnabled || false)
  const [telegramNotifications, setTelegramNotifications] = useState(user.telegramNotificationsEnabled || false)
  const [telegramCode, setTelegramCode] = useState<string | null>(user.telegramVerificationCode || null)
  const [telegramChatId, setTelegramChatId] = useState<string | null>(user.telegramChatId || null)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [unlinkingTelegram, setUnlinkingTelegram] = useState(false)

  const handleGenerateTelegramCode = async () => {
    setGeneratingCode(true)
    try {
      const code = await generateTelegramCode(user.id)
      if (code) {
        setTelegramCode(code)
        showToast("CÓDIGO_GERADO", "success")
      } else {
        showToast("ERRO: FALHA_AO_GERAR_CODIGO", "error")
      }
    } catch {
      showToast("ERRO: FALHA_AO_GERAR_CODIGO", "error")
    } finally {
      setGeneratingCode(false)
    }
  }

  const handleUnlinkTelegram = async () => {
    setUnlinkingTelegram(true)
    try {
      const ok = await unlinkTelegram(user.id)
      if (ok) {
        setTelegramChatId(null)
        setTelegramNotifications(false)
        setTelegramCode(null)
        showToast("TELEGRAM_DESVINCULADO", "success")
      } else {
        showToast("ERRO: FALHA_AO_DESVINCULAR", "error")
      }
    } catch {
      showToast("ERRO: FALHA_AO_DESVINCULAR", "error")
    } finally {
      setUnlinkingTelegram(false)
    }
  }

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showToast("ERRO: ARQUIVO_DEVE_TER_NO_MAXIMO_5MB", "error")
      return
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      showToast("ERRO: TIPO_INVALIDO_SOMENTE_JPEG_OU_PNG", "error")
      return
    }
    const localPreview = URL.createObjectURL(file)
    setAvatarPreview(localPreview)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("userId", user.id)
      formData.append("file", file)
      const res = await fetch("/api/user/avatar", { method: "POST", body: formData })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.user?.avatarUrl) {
        setAvatarPreview(data.user.avatarUrl)
        onAvatarUpdated?.(data.user.avatarUrl)
        showToast("AVATAR_ATUALIZADO", "success")
      } else {
        showToast(data.error || "ERRO: FALHA_AO_ENVIAR_AVATAR", "error")
        setAvatarPreview(user.avatarUrl || null)
      }
    } catch {
      showToast("ERRO: FALHA_AO_ENVIAR_AVATAR", "error")
      setAvatarPreview(user.avatarUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = () => {
    const updates: Partial<TeamMember> & { password?: string } = {
      name: name.toUpperCase().replace(/\s+/g, "_"),
      email,
      role: role.toUpperCase().replace(/\s+/g, "_"),
      emailNotificationsEnabled: emailNotifications,
      telegramNotificationsEnabled: telegramNotifications,
      telegramChatId: telegramChatId,
      telegramVerificationCode: telegramCode,
    }
    if (password) {
      updates.password = password
    }
    onSave(updates)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-[var(--br-overlay)] z-50 flex items-center justify-center p-4">
      <div className="border-2 border-[var(--br-accent)] bg-[var(--br-bg)] w-full max-w-md">
        <div className="border-b border-[var(--br-accent)] p-4 flex justify-between items-center">
          <span className="text-[var(--br-accent)] font-bold">{">"} EDIT_PROFILE</span>
          <button
            onClick={onClose}
            className="text-[var(--br-danger)] hover:bg-[var(--br-danger)] hover:text-black px-2 py-1 border border-[var(--br-danger)] transition-colors text-xs"
          >
            [ CLOSE ]
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="text-[var(--br-accent)] text-xs mb-2">{">"} PROFILE_PHOTO (JPEG/PNG, máx. 2MB):</div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 shrink-0 overflow-hidden rounded-full border-2 border-[var(--br-accent)] bg-[var(--br-bg-secondary)]">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--br-accent)] font-bold">
                    {name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <label className={`cursor-pointer h-10 px-3 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs flex items-center hover:bg-[var(--br-accent)] hover:text-black transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                {uploading ? "[ ENVIANDO... ]" : "[ ENVIAR_FOTO ]"}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    handleAvatarFile(e.target.files?.[0])
                    e.target.value = ""
                  }}
                />
              </label>
            </div>
          </div>
          <div>
            <div className="text-[var(--br-accent)] text-xs mb-2">{">"} NAME:</div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base focus:border-[var(--br-accent)] focus:outline-none"
            />
          </div>
          <div>
            <div className="text-[var(--br-accent)] text-xs mb-2">{">"} EMAIL:</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base focus:border-[var(--br-accent)] focus:outline-none"
            />
          </div>
          <div>
            <div className="text-[var(--br-accent)] text-xs mb-2">{">"} NEW_PASSWORD (deixe vazio para manter):</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full h-12 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none"
            />
          </div>
          <div>
            <div className="text-[var(--br-accent)] text-xs mb-2">{">"} ROLE:</div>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-12 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base focus:border-[var(--br-accent)] focus:outline-none"
            />
          </div>

          {/* NOTIFICATION SETTINGS */}
          <div className="border-t border-[var(--br-border)] pt-4 mt-2">
            <div className="text-[var(--br-warn)] font-bold text-xs mb-3">{">"} NOTIFICACOES_EXTERNAS</div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 accent-[var(--br-accent)]"
                />
                <span className="text-xs text-[var(--br-text)]">EMAIL ({email})</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegramNotifications}
                  onChange={(e) => setTelegramNotifications(e.target.checked)}
                  className="w-4 h-4 accent-[var(--br-warn)]"
                />
                <span className="text-xs text-[var(--br-text)]">TELEGRAM</span>
              </label>

              {telegramNotifications && (
                <div className="space-y-2 pl-6 border-l border-[var(--br-border)] ml-2">
                  {telegramChatId ? (
                    <div className="text-xs text-[var(--br-success)] flex items-center gap-2">
                      <span>✓ VINCULADO (chat_id: {telegramChatId})</span>
                      <button
                        onClick={handleUnlinkTelegram}
                        disabled={unlinkingTelegram}
                        className="ml-2 px-2 py-1 border border-[var(--br-danger)] text-[var(--br-danger)] text-[10px] hover:bg-[var(--br-danger)] hover:text-black transition-colors"
                      >
                        [ DESVINCULAR ]
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs text-[var(--br-accent)]/70 mb-2">{">"} CODIGO_DE_VERIFICACAO:</div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-[11px] text-[var(--br-text)] bg-[var(--br-bg-secondary)] border border-[var(--br-border)] px-2 py-1.5 font-mono break-all">
                          {telegramCode || "NENHUM"}
                        </code>
                        <button
                          onClick={handleGenerateTelegramCode}
                          disabled={generatingCode}
                          className="shrink-0 px-2 py-1.5 border border-[var(--br-warn)] text-[var(--br-warn)] text-[10px] hover:bg-[var(--br-warn)] hover:text-black transition-colors"
                        >
                          {generatingCode ? "[ GERANDO... ]" : "[ GERAR_CODIGO ]"}
                        </button>
                      </div>
                      <div className="text-[10px] text-[var(--br-accent)]/50">
                        1. Abra o Telegram e busque por @{process.env.TELEGRAM_BOT_USERNAME || "BrolabTaskBot"}<br/>
                        2. Envie <code>/start {telegramCode || "SEU_CODIGO"}</code><br/>
                        3. Aguarde a confirmação
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-[var(--br-accent)]/50 text-xs">
            {">"} ROLE_ID: {user.id}
          </div>
          <button
            onClick={handleSave}
            className="w-full h-12 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors"
          >
            [ SAVE_CHANGES ]
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== COVER PICKER MODAL ====================
function CoverPickerModal({
  task,
  onClose,
  onCoverUpdated,
}: {
  task: Task
  onClose: () => void
  onCoverUpdated: (coverImageUrl: string | null) => void
}) {
  const [tab, setTab] = useState<"upload" | "bank">("upload")
  const [uploading, setUploading] = useState(false)
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Array<{ id: string; thumb: string; regular: string; alt: string; creditName: string; creditLink: string }>>([])
  const [searchError, setSearchError] = useState<string | null>(null)

  const handleUpload = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showToast("ERRO: ARQUIVO_DEVE_TER_NO_MAXIMO_5MB", "error")
      return
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      showToast("ERRO: TIPO_INVALIDO_SOMENTE_JPEG_OU_PNG", "error")
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("taskId", task.id)
      formData.append("file", file)
      const res = await fetch("/api/tasks/cover", { method: "POST", body: formData })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.coverImageUrl) {
        onCoverUpdated(data.coverImageUrl)
        showToast("CAPA_ADICIONADA", "success")
        onClose()
      } else {
        showToast(data.error || "ERRO: FALHA_AO_ENVIAR_CAPA", "error")
      }
    } catch {
      showToast("ERRO: FALHA_AO_ENVIAR_CAPA", "error")
    } finally {
      setUploading(false)
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setSearchError(null)
    try {
      const res = await fetch(`/api/unsplash?query=${encodeURIComponent(query.trim())}`)
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setResults(data.results || [])
      } else {
        setSearchError(data.error || "ERRO: FALHA_AO_BUSCAR_IMAGENS")
      }
    } catch {
      setSearchError("ERRO: FALHA_AO_BUSCAR_IMAGENS")
    } finally {
      setSearching(false)
    }
  }

  const handlePickUnsplash = (img: { regular: string; alt: string; creditName: string; creditLink: string }) => {
    onCoverUpdated(img.regular)
    showToast(`CAPA_ADICIONADA (${img.creditName ? "por " + img.creditName : "Unsplash"})`, "success")
    onClose()
  }

  const handleRemove = async () => {
    try {
      const res = await fetch(`/api/tasks/cover?taskId=${task.id}`, { method: "DELETE" })
      if (res.ok) {
        onCoverUpdated(null)
        showToast("CAPA_REMOVIDA", "success")
        onClose()
      } else {
        const data = await res.json().catch(() => ({}))
        showToast(data.error || "ERRO: FALHA_AO_REMOVER_CAPA", "error")
      }
    } catch {
      showToast("ERRO: FALHA_AO_REMOVER_CAPA", "error")
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--br-overlay)] z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="border-2 border-[var(--br-accent)] bg-[var(--br-bg)] w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[var(--br-accent)] p-4 flex justify-between items-center">
          <span className="text-[var(--br-accent)] font-bold">{">"} CAPA: {task.title}</span>
          <button
            onClick={onClose}
            className="text-[var(--br-danger)] hover:bg-[var(--br-danger)] hover:text-black px-2 py-1 border border-[var(--br-danger)] transition-colors text-xs"
          >
            [ CLOSE ]
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          {task.coverImageUrl && (
            <div className="flex items-center gap-3">
              <div className="w-24 h-14 shrink-0 border border-[var(--br-border)] bg-center bg-cover" style={{ backgroundImage: `url("${task.coverImageUrl}")` }} />
              <button
                onClick={handleRemove}
                className="h-8 px-3 border border-[var(--br-danger)] text-[var(--br-danger)] text-xs hover:bg-[var(--br-danger)] hover:text-black transition-colors"
              >
                [ REMOVER_CAPA ]
              </button>
            </div>
          )}

          <div className="flex gap-1">
            {(["upload", "bank"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`h-8 px-3 text-xs border transition-colors ${
                  tab === t
                    ? "border-[var(--br-accent)] bg-[var(--br-accent)] text-black font-bold"
                    : "border-[var(--br-border)] text-[var(--br-text-secondary)] hover:border-[var(--br-accent)]"
                }`}
              >
                {t === "upload" ? "[ UPLOAD ]" : "[ BANCO_IMAGENS ]"}
              </button>
            ))}
          </div>

          {tab === "upload" ? (
            <div>
              <div className="text-[var(--br-accent)] text-xs mb-2">{">"} UPLOAD (JPEG/PNG, máx. 5MB):</div>
              <label className={`inline-flex items-center h-10 px-3 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs cursor-pointer hover:bg-[var(--br-accent)] hover:text-black transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                {uploading ? "[ ENVIANDO... ]" : "[ ENVIAR_CAPA ]"}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    handleUpload(e.target.files?.[0])
                    e.target.value = ""
                  }}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-[var(--br-accent)] text-xs">{">"} BANCO_IMAGENS (Unsplash):</div>
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
                  placeholder="buscar imagem por palavra-chave..."
                  className="flex-1 h-10 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-sm placeholder:text-[var(--br-text-secondary)] focus:border-[var(--br-accent)] focus:outline-none"
                />
                <button
                  onClick={handleSearch}
                  disabled={!query.trim() || searching}
                  className="h-10 px-4 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors disabled:opacity-50"
                >
                  {searching ? "[ BUSCANDO... ]" : "[ BUSCAR ]"}
                </button>
              </div>
              {searchError && (
                <div className="text-[var(--br-danger)] text-xs">{searchError}</div>
              )}
              {results.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {results.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => handlePickUnsplash(img)}
                      title={`${img.alt}${img.creditName ? ` — por ${img.creditName}` : ""}`}
                      className="group border border-[var(--br-border)] hover:border-[var(--br-accent)] transition-colors overflow-hidden text-left"
                    >
                      <div className="h-16 bg-center bg-cover" style={{ backgroundImage: `url("${img.thumb}")` }} />
                      <div className="px-1 py-0.5 text-[9px] text-[var(--br-text-secondary)] truncate">{img.creditName || "Unsplash"}</div>
                    </button>
                  ))}
                </div>
              )}
              {results.length === 0 && !searching && !searchError && (
                <div className="text-[var(--br-accent)]/50 text-xs">NO_RESULTS_OU_AGUARDANDO_BUSCA</div>
              )}
            </div>
          )}
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
    <div className="fixed inset-0 bg-[var(--br-overlay)] z-50 flex items-center justify-center p-4">
      <div className="border-2 border-[var(--br-accent)] bg-[var(--br-bg)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-[var(--br-accent)] p-4 flex justify-between items-center">
          <span className="text-[var(--br-accent)] font-bold">
            {">"} TEAM_REGISTRY {currentUser.isAdmin && "[ ADMIN_MODE ]"}
          </span>
          <button
            onClick={onClose}
            className="text-[var(--br-danger)] hover:bg-[var(--br-danger)] hover:text-black px-2 py-1 border border-[var(--br-danger)] transition-colors text-xs"
          >
            [ CLOSE ]
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {team.map((member) => (
              <div
                key={member.id}
                className="border border-[var(--br-border)] p-3 bg-[var(--br-bg-secondary)]"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="flex items-center gap-2">
                    <MemberAvatar name={member.name} url={member.avatarUrl} size={24} />
                    <span className="text-[var(--br-text)] font-bold text-sm">
                      {member.name}
                    </span>
                    {member.isAdmin && (
                      <span className="text-[var(--br-danger)] text-xs border border-[var(--br-danger)] px-1">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-[var(--br-accent)] text-xs">
                    @{member.username} | [{member.role}]
                  </div>
                  <div className="text-[var(--br-accent)]/50 text-xs md:ml-auto flex items-center gap-2">
                    {member.email}
                    {currentUser.isAdmin && member.id !== currentUser.id && (
                      <button
                        onClick={() => onDeleteMember(member.id)}
                        className="text-[var(--br-danger)] hover:bg-[var(--br-danger)] hover:text-black px-2 py-1 border border-[var(--br-danger)] transition-colors"
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
                  className="mt-4 w-full h-12 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors"
                >
                  [ + CREATE_USER ]
                </button>
              ) : (
                <div className="mt-4 border border-[var(--br-accent)] p-4">
                  <div className="text-[var(--br-accent)] text-xs mb-3">
                    {">"} NEW_USER_ENTRY
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="NAME..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full h-12 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="USERNAME (ex: joao.silva)..."
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full h-12 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="ROLE..."
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full h-12 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none"
                    />
                    <input
                      type="email"
                      placeholder="EMAIL..."
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full h-12 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none"
                    />
                    <input
                      type="password"
                      placeholder="PASSWORD..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-12 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none"
                    />
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => setNewIsAdmin(!newIsAdmin)}
                        className={`w-6 h-6 border flex items-center justify-center transition-colors ${
                          newIsAdmin
                            ? "border-[var(--br-accent)] bg-[var(--br-accent)] text-black"
                            : "border-[var(--br-border)]"
                        }`}
                      >
                        {newIsAdmin && "✓"}
                      </div>
                      <span className="text-[var(--br-accent)] text-xs">
                        ADMIN_PRIVILEGES
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSubmit}
                        disabled={!newName.trim() || !newEmail.trim() || !newPassword.trim()}
                        className="flex-1 h-12 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors disabled:opacity-50"
                      >
                        [ CREATE ]
                      </button>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="h-12 px-4 border border-[var(--br-border)] text-[var(--br-accent)]/50 text-xs hover:border-[var(--br-accent)] transition-colors"
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

// ==================== LABEL MANAGER (seletor no cartão) ====================
function LabelManager({
  labels,
  onRemove,
  workspaceLabels,
  onToggleWorkspaceLabel,
}: {
  labels: Label[]
  onRemove: (id: string) => void
  workspaceLabels?: Label[]
  onToggleWorkspaceLabel?: (labelId: string) => void
}) {
  const [search, setSearch] = useState("")

  // Resolve nomes/cores atuais a partir dos labels globais (sync de renomeação)
  const resolvedLabels = labels.map(
    (l) => workspaceLabels?.find((w) => w.id === l.id) || l,
  )

  const filteredWorkspace = (workspaceLabels || []).filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="border border-[var(--br-border)] p-3">
      <div className="text-[var(--br-accent)] text-xs mb-3">{">"} LABELS:</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {resolvedLabels.length === 0 && (
          <span className="text-[var(--br-accent)]/30 text-xs">NO_LABELS</span>
        )}
        {resolvedLabels.map((label) => (
          <div key={label.id} className="flex items-center gap-1">
            <LabelBadge label={label} />
            <button
              onClick={() => onRemove(label.id)}
              className="text-[var(--br-danger)] text-xs hover:bg-[var(--br-danger)] hover:text-black px-1 transition-colors"
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
            className="w-full h-8 px-2 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-xs placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none mb-2"
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
                      ? "border-[var(--br-accent)] bg-[var(--br-accent)]/10 text-[var(--br-accent)]"
                      : "border-[var(--br-border)] text-[var(--br-text-secondary)] hover:border-[var(--br-border-strong)]"
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

      {(!workspaceLabels || workspaceLabels.length === 0) && (
        <div className="text-[var(--br-accent)]/40 text-[10px]">
          Nenhum label global. Crie labels no editor no topo do board.
        </div>
      )}
    </div>
  )
}

// ==================== COLOR PICKER ====================
function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {LABEL_COLORS.map((c) => (
        <button
          key={c.value}
          onClick={() => onChange(c.value)}
          className={`w-full aspect-square border-2 transition-colors rounded ${
            value === c.value
              ? "border-[var(--br-accent)] scale-110"
              : "border-transparent"
          }`}
          style={{ backgroundColor: c.value }}
          title={c.name}
        />
      ))}
    </div>
  )
}

// ==================== LABEL EDITOR (barra superior do board) ====================
function LabelEditor({
  labels,
  onManage,
  onAdd,
}: {
  labels: Label[]
  onManage: (labelId?: string) => void
  onAdd: () => void
}) {
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap border border-[var(--br-border)] p-2">
      <span className="text-[var(--br-accent)] text-xs whitespace-nowrap">{">"} LABELS:</span>
      <div className="flex flex-wrap gap-1.5 flex-1 min-w-0 items-center">
        {labels.length === 0 && (
          <span className="text-[var(--br-accent)]/30 text-xs">NO_LABELS</span>
        )}
        {labels.map((label) => (
          <div key={label.id} className="flex items-center gap-0.5">
            <LabelBadge label={label} />
            <button
              onClick={() => onManage(label.id)}
              title={`Editar ${label.name}`}
              className="text-[var(--br-text-secondary)] hover:text-[var(--br-accent)] text-[10px] px-1 border border-transparent hover:border-[var(--br-accent)]/40 transition-colors"
            >
              ✎
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={onAdd}
        className="h-7 px-2 border border-dashed border-[var(--br-border)] text-[var(--br-accent)]/60 text-[10px] hover:border-[var(--br-accent)] hover:text-[var(--br-accent)] transition-colors whitespace-nowrap"
      >
        [ + NOVO ]
      </button>
      <button
        onClick={() => onManage()}
        className="h-7 px-2 border border-[var(--br-border)] text-[var(--br-accent)] text-[10px] hover:border-[var(--br-accent)] transition-colors whitespace-nowrap"
      >
        [ EDITAR ]
      </button>
    </div>
  )
}

// ==================== LABEL EDITOR MODAL (gerenciar labels) ====================
function LabelManagerModal({
  labels,
  initialLabelId,
  onClose,
  onChanged,
}: {
  labels: Label[]
  initialLabelId?: string | null
  onClose: () => void
  onChanged: () => void
}) {
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(LABEL_COLORS[3].value)
  const [editingId, setEditingId] = useState<string | null>(initialLabelId || null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const [busy, setBusy] = useState(false)

  const startEdit = (label: Label) => {
    setEditingId(label.id)
    setEditName(label.name)
    setEditColor(label.color)
  }

  const handleCreate = async () => {
    if (!newName.trim() || busy) return
    setBusy(true)
    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || "ERRO: FALHA_AO_CRIAR_ETIQUETA", "error")
        return
      }
      setNewName("")
      setNewColor(LABEL_COLORS[3].value)
      onChanged()
    } catch {
      showToast("ERRO: FALHA_AO_CRIAR_ETIQUETA", "error")
    } finally {
      setBusy(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingId || !editName.trim() || busy) return
    setBusy(true)
    try {
      const res = await fetch("/api/labels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name: editName.trim(), color: editColor }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || "ERRO: FALHA_AO_ATUALIZAR_ETIQUETA", "error")
        return
      }
      setEditingId(null)
      onChanged()
    } catch {
      showToast("ERRO: FALHA_AO_ATUALIZAR_ETIQUETA", "error")
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (labelId: string) => {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/labels?id=${labelId}`, { method: "DELETE" })
      if (!res.ok) {
        showToast("ERRO: FALHA_AO_DELETAR_ETIQUETA", "error")
        return
      }
      if (editingId === labelId) setEditingId(null)
      onChanged()
    } catch {
      showToast("ERRO: FALHA_AO_DELETAR_ETIQUETA", "error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--br-overlay)] z-50 flex items-center justify-center p-4">
      <div className="border-2 border-[var(--br-accent)] bg-[var(--br-bg)] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-[var(--br-accent)] p-4 flex justify-between items-center">
          <span className="text-[var(--br-accent)] font-bold">{">"} LABEL_EDITOR</span>
          <button
            onClick={onClose}
            className="text-[var(--br-danger)] hover:bg-[var(--br-danger)] hover:text-black px-2 py-1 border border-[var(--br-danger)] transition-colors text-xs"
          >
            [ CLOSE ]
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="border border-[var(--br-border)] p-3">
            <div className="text-[var(--br-accent)] text-xs mb-3">{">"} NOVO_LABEL:</div>
            <input
              type="text"
              placeholder="LABEL_NAME..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full h-10 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-sm placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none mb-3"
            />
            <ColorPicker value={newColor} onChange={setNewColor} />
            <div className="text-[var(--br-accent)]/50 text-[10px] mt-1">{newColor}</div>
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || busy}
              className="w-full h-10 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors disabled:opacity-50 mt-3"
            >
              [ ADD_LABEL ]
            </button>
          </div>

          <div>
            <div className="text-[var(--br-accent)] text-xs mb-3">{">"} LABELS ({labels.length}):</div>
            {labels.length === 0 ? (
              <div className="text-[var(--br-accent)]/30 text-xs">NO_LABELS</div>
            ) : (
              <div className="space-y-2">
                {labels.map((label) => (
                  <div key={label.id} className="border border-[var(--br-border)] p-2">
                    {editingId === label.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                          className="w-full h-10 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-sm focus:border-[var(--br-accent)] focus:outline-none"
                        />
                        <ColorPicker value={editColor} onChange={setEditColor} />
                        <div className="text-[var(--br-accent)]/50 text-[10px]">{editColor}</div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdate}
                            disabled={!editName.trim() || busy}
                            className="flex-1 h-8 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors disabled:opacity-50"
                          >
                            [ SAVE ]
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="h-8 px-3 border border-[var(--br-border)] text-[var(--br-accent)]/50 text-xs hover:border-[var(--br-accent)] transition-colors"
                          >
                            [ CANCEL ]
                          </button>
                          <button
                            onClick={() => handleDelete(label.id)}
                            className="h-8 px-3 border border-[var(--br-danger)]/60 text-[var(--br-danger)] text-xs hover:bg-[var(--br-danger)] hover:text-black transition-colors"
                          >
                            [ EXCLUIR ]
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-sm flex-shrink-0" style={{ backgroundColor: label.color }} />
                        <span className="text-[var(--br-text)] text-xs flex-1 min-w-0 truncate">{label.name}</span>
                        <button
                          onClick={() => startEdit(label)}
                          className="h-7 px-2 border border-[var(--br-border)] text-[var(--br-accent)] text-[10px] hover:border-[var(--br-accent)] transition-colors"
                        >
                          [ EDITAR ]
                        </button>
                        <button
                          onClick={() => handleDelete(label.id)}
                          className="h-7 px-2 border border-[var(--br-danger)]/60 text-[var(--br-danger)] text-[10px] hover:bg-[var(--br-danger)] hover:text-black transition-colors"
                        >
                          [ EXCLUIR ]
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
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
        className="w-full px-3 py-2 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none resize-none"
      />
      {showMentions && filteredTeam.length > 0 && (
        <div className="absolute left-0 right-0 bottom-full mb-1 bg-[var(--br-bg)] border border-[var(--br-accent)] max-h-40 overflow-y-auto z-10">
          {filteredTeam.map((member) => (
            <button
              key={member.id}
              onClick={() => handleSelectMention(member)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--br-accent)] hover:text-black transition-colors"
            >
              <span className="text-[var(--br-accent)]">@{member.username}</span>
              <span className="text-[var(--br-text)] ml-2">{member.name}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        className="mt-2 w-full h-10 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors disabled:opacity-50"
      >
        [ POST_COMMENT ]
      </button>
    </div>
  )
}

// ==================== SUBTASK ROW ====================
const SUBTASK_STATUSES = ["BACKLOG", "FAZENDO", "ALTERAÇÕES", "APROVADO", "FEITO"]

function SubtaskStatusSelect({
  value,
  onChange,
  light,
}: {
  value: string
  onChange: (status: string) => void
  light?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      title="Alterar status"
      className={`h-7 px-1.5 border text-[10px] focus:outline-none cursor-pointer ${
        light
          ? "bg-[var(--br-bg-secondary)] border-[var(--br-border)] text-[var(--br-text)]"
          : "bg-[var(--br-bg-secondary)] border-[var(--br-border)] text-[var(--br-accent)] hover:border-[var(--br-accent)]"
      }`}
    >
      {SUBTASK_STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  )
}

function SubtaskAssigneeSelect({
  value,
  team,
  onChange,
  light,
}: {
  value: string | null
  team: TeamMember[]
  onChange: (assigneeId: string | null) => void
  light?: boolean
}) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      onClick={(e) => e.stopPropagation()}
      title="Atribuir responsável"
      className={`h-7 max-w-[120px] px-1.5 border text-[10px] focus:outline-none cursor-pointer ${
        light
          ? "bg-[var(--br-bg-secondary)] border-[var(--br-border)] text-[var(--br-text)]"
          : "bg-[var(--br-bg-secondary)] border-[var(--br-border)] text-[var(--br-accent)]/70 hover:border-[var(--br-accent)]"
      }`}
    >
      <option value="">— none —</option>
      {team.map((m) => (
        <option key={m.id} value={m.id}>@{m.username}</option>
      ))}
    </select>
  )
}

function MemberAvatar({ name, light, url, size = 20 }: { name: string; light?: boolean; url?: string | null; size?: number }) {
  const initials = (name || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        title={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      title={name}
      style={{ width: size, height: size, fontSize: Math.max(8, size / 2.5) }}
      className={`shrink-0 rounded-full flex items-center justify-center font-bold ${
        light ? "bg-[var(--br-bg-secondary)] text-[var(--br-text)]" : "bg-[var(--br-border)] text-[var(--br-accent)] border border-[var(--br-accent)]/40"
      }`}
    >
      {initials}
    </span>
  )
}

// ==================== SUBTASK CARD (board) ====================
function SubtaskCard({
  subtask,
  team,
  onStatusChange,
  onAssigneeChange,
}: {
  subtask: BoardSubtask
  team: TeamMember[]
  onStatusChange: (subtaskId: string, newStatus: string) => void
  onAssigneeChange: (subtaskId: string, assigneeId: string | null) => void
}) {
  const assignee = team.find((m) => m.id === subtask.assigneeId)
  const done = subtask.status === "APROVADO" || subtask.status === "FEITO"

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`rounded border p-2 mb-2 transition-colors ${
        done ? "bg-[var(--br-card-done)] border-[var(--br-border-strong)]" : "bg-[var(--br-card)] border-[var(--br-border)] hover:border-[var(--br-border-strong)]"
      }`}
    >
      <div className={`text-[11px] font-bold break-words ${done ? "text-[var(--br-text-secondary)] line-through" : "text-[var(--br-text)]"}`}>
        {subtask.title}
      </div>
      <div className="flex items-center justify-between gap-1 mt-1.5">
        <div className="flex items-center gap-1 min-w-0">
          {assignee ? (
            <MemberAvatar name={assignee.name} light url={assignee.avatarUrl} />
          ) : (
            <span className="w-5 h-5 shrink-0 rounded-full border border-dashed border-[var(--br-border-strong)] flex items-center justify-center text-[8px] text-[var(--br-border-strong)]" title="Sem responsável">?</span>
          )}
          <SubtaskAssigneeSelect
            value={subtask.assigneeId}
            team={team}
            light
            onChange={(assigneeId) => onAssigneeChange(subtask.id, assigneeId)}
          />
        </div>
        <SubtaskStatusSelect
          value={subtask.status}
          light
          onChange={(status) => onStatusChange(subtask.id, status)}
        />
      </div>
    </div>
  )
}

function SubtaskRow({
  subtask,
  onUpdateStatus,
  onAddComment,
  onUploadComplete,
  onUpdateAssignee,
  currentUser,
  team,
  highlight,
}: {
  subtask: Subtask
  onUpdateStatus: (id: string, newStatus: string) => void
  onAddComment: (subtaskId: string, content: string) => void
  onUploadComplete?: () => void
  onUpdateAssignee?: (subtaskId: string, assigneeId: string | null) => void
  currentUser: TeamMember
  team: TeamMember[]
  highlight?: boolean
}) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [liveTime, setLiveTime] = useState(subtask.timeSpent)
  const [flashing, setFlashing] = useState(false)
  const rowRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!highlight) return
    setFlashing(true)
    const scrollTimer = setTimeout(() => {
      rowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 150)
    const flashTimer = setTimeout(() => setFlashing(false), 3000)
    return () => {
      clearTimeout(scrollTimer)
      clearTimeout(flashTimer)
    }
  }, [highlight])

  useEffect(() => {
    if (!subtask.timerStartedAt) {
      setLiveTime(subtask.timeSpent)
      return
    }
    const timerStartedAt = subtask.timerStartedAt
    const interval = setInterval(() => {
      const elapsed = (Date.now() - new Date(timerStartedAt).getTime()) / 1000
      setLiveTime(subtask.timeSpent + Math.round(elapsed))
    }, 1000)
    return () => clearInterval(interval)
  }, [subtask.timerStartedAt, subtask.timeSpent])

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
    const color = liveTime > est ? "var(--br-danger)" : "var(--br-accent)"
    return (
      <div className="mt-2">
        <div className="flex justify-between text-[10px] text-[var(--br-accent)]/50 mb-1">
          <span>Estimado: {subtask.estimatedHours}h</span>
          <span>Real: {formatTime(liveTime)}</span>
        </div>
        <div className="w-full h-1.5 bg-[var(--br-border)]">
          <div
            className="h-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={rowRef}
      className={`border bg-[var(--br-bg-secondary)] p-3 transition-colors ${
        flashing ? "border-[var(--br-accent)]" : "border-[var(--br-border)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[var(--br-text)] text-sm font-bold break-words">{subtask.title}</div>
          {subtask.description && (
            <div className="text-[var(--br-text)]/60 text-xs mt-1 break-words">{subtask.description}</div>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 border ${isTimerRunning ? "border-[var(--br-accent)] text-[var(--br-accent)] animate-pulse" : "border-[var(--br-border)] text-[var(--br-accent)]/70"}`}>
              {isTimerRunning ? "▶ CRONOMETRO" : subtask.status}
            </span>
            <span className="text-xs text-[var(--br-accent)]/70">{formatTime(liveTime)}</span>
            {subtask.estimatedHours > 0 && (
              <span className="text-xs text-[var(--br-accent)]/50">EST: {subtask.estimatedHours}h</span>
            )}
          </div>
          {compareBar()}
          <div className="flex gap-1 mt-2 flex-wrap items-center">
            <SubtaskStatusSelect value={subtask.status} onChange={(s) => onUpdateStatus(subtask.id, s)} />
            {subtask.assigneeId || team.find((m) => m.id === subtask.assigneeId) ? (
              <MemberAvatar name={team.find((m) => m.id === subtask.assigneeId)?.name || "?"} url={team.find((m) => m.id === subtask.assigneeId)?.avatarUrl} />
            ) : null}
            <SubtaskAssigneeSelect
              value={subtask.assigneeId}
              team={team}
              onChange={(assigneeId) => onUpdateAssignee?.(subtask.id, assigneeId)}
            />
            <button onClick={() => setShowComments(!showComments)}
              className="h-7 px-1.5 border border-[var(--br-border)] text-[var(--br-accent)]/50 text-[10px] hover:border-[var(--br-accent)] transition-colors">
              [{subtask.comments.length}]
            </button>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="mt-3 border-t border-[var(--br-border)] pt-3 space-y-2">
          {subtask.comments.length === 0 && (
            <div className="text-[var(--br-accent)]/50 text-xs">NO_COMMENTS</div>
          )}
          {subtask.comments.map((c) => (
            <div key={c.id} className="border border-[var(--br-border)] bg-[var(--br-bg)] p-2">
              <div className="flex items-center gap-2">
                <MemberAvatar name={team.find((m) => m.username === c.authorName || m.name === c.authorName)?.name || c.authorName} url={team.find((m) => m.username === c.authorName || m.name === c.authorName)?.avatarUrl} size={16} />
                <div className="text-[var(--br-accent)] text-[10px] font-bold">{c.authorName}</div>
              </div>
              <div className="text-[var(--br-text)] text-xs mt-1">{c.content}</div>
            </div>
          ))}
          {subtask.files.length > 0 && (
            <div className="space-y-1">
              <div className="text-[var(--br-accent)]/50 text-[10px]">ARQUIVOS:</div>
              {subtask.files.map((f) => (
                <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer"
                  className="block border border-[var(--br-border)] bg-[var(--br-bg)] p-1.5 text-[var(--br-accent)] text-[10px] hover:underline">
                  {f.name} ({(f.size / 1024).toFixed(1)} KB)
                </a>
              ))}
            </div>
          )}
          <MentionInput value={newComment} onChange={setNewComment}
            onSubmit={handleAddComment} team={team} placeholder="Comentário (use @ para mencionar)..." />
          <label className="flex items-center gap-2 cursor-pointer p-1.5 border border-dashed border-[var(--br-border)] hover:border-[var(--br-accent)] transition-colors">
            <span className="text-[var(--br-accent)]/50 text-[10px]">[ UPLOAD_FILE ]</span>
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

// ==================== ACTIVITY FEED ====================
interface TaskActivity {
  id: string
  taskId: string
  userId: string | null
  action: string
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  createdAt: string
  userName: string | null
  userAvatarUrl: string | null
}

interface GitIntegration {
  id: string
  provider: string
  repositoryFullName: string
  tokenConfigured: boolean
  createdAt: string
}

function describeActivity(a: TaskActivity): string {
  const user = a.userName || "Sistema"
  const nv = a.newValue || {}
  const ov = a.oldValue || {}
  const subtaskTitle = nv.title || ov.title ? `"${(nv.title || ov.title) as string}"` : ""
  switch (a.action) {
    case "created":
      return `${user} criou a tarefa`
    case "title":
      return `${user} alterou o título de "${String(ov.title)}" para "${String(nv.title)}"`
    case "description":
      return `${user} alterou a descrição`
    case "status":
      return nv.isComplete ? `${user} concluiu a tarefa` : `${user} reabriu a tarefa`
    case "archive":
      return nv.isClosed ? `${user} arquivou a tarefa` : `${user} restaurou a tarefa`
    case "move":
      return `${user} moveu a tarefa de "${String(ov.column)}" para "${String(nv.column)}"`
    case "assignee":
      return nv.name
        ? `${user} atribuiu a tarefa a ${String(nv.name)}`
        : `${user} removeu o responsável da tarefa`
    case "cover":
      return nv.url ? `${user} adicionou uma capa` : `${user} removeu a capa`
    case "comment": {
      const content = String(nv.content || "")
      return `${user} comentou: "${content.length > 60 ? content.slice(0, 60) + "..." : content}"`
    }
    case "subtask_created":
      return `${user} criou a subtarefa ${subtaskTitle}`
    case "subtask_status":
      return `${user} alterou o status da subtarefa ${subtaskTitle} de "${String(ov.status)}" para "${String(nv.status)}"`
    case "subtask_assignee":
      return nv.name
        ? `${user} atribuiu a subtarefa ${subtaskTitle} a ${String(nv.name)}`
        : `${user} removeu o responsável da subtarefa ${subtaskTitle}`
    case "git_commit":
      return `Commit ${String(nv.sha || "")}: ${String(nv.message || "")}`
    case "git_pr":
      return `PR #${String(nv.number || "")} (${String(nv.state || "")}): ${String(nv.title || "")}`
    default:
      return `${user} executou a ação "${a.action}"`
  }
}

function ActivityFeed({ taskId }: { taskId: string }) {
  const [activities, setActivities] = useState<TaskActivity[] | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}/activities`)
        const data = await res.json().catch(() => ({}))
        if (!cancelled) setActivities(data.activities || [])
      } catch {
        if (!cancelled) setActivities([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [taskId])

  if (activities === null) {
    return <div className="text-[var(--br-accent)]/50 text-xs">CARREGANDO_ATIVIDADES...</div>
  }

  if (activities.length === 0) {
    return <div className="text-[var(--br-accent)]/50 text-xs">NO_ACTIVITIES</div>
  }

  return (
    <div className="space-y-0">
      {activities.map((a, i) => (
        <div key={a.id} className="flex gap-3 pb-4 relative">
          {i < activities.length - 1 && (
            <div className="absolute left-[10px] top-8 bottom-0 w-px bg-[var(--br-border)]" />
          )}
          <MemberAvatar name={a.userName || "?"} url={a.userAvatarUrl} size={20} />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[var(--br-text)] break-words">{describeActivity(a)}</div>
            <div className="text-[10px] text-[var(--br-text-secondary)] mt-0.5">
              {new Date(a.createdAt).toLocaleString("pt-BR")}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ==================== GIT REFERENCES ====================
function GitReferences({ taskId }: { taskId: string }) {
  const [refs, setRefs] = useState<TaskActivity[] | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}/activities`)
        const data = await res.json().catch(() => ({}))
        if (!cancelled) {
          const all: TaskActivity[] = data.activities || []
          setRefs(all.filter((a) => a.action === "git_commit" || a.action === "git_pr"))
        }
      } catch {
        if (!cancelled) setRefs([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [taskId])

  if (refs === null) {
    return <div className="text-[var(--br-accent)]/50 text-xs">CARREGANDO_REFERENCIAS...</div>
  }

  if (refs.length === 0) {
    return <div className="text-[var(--br-accent)]/50 text-xs">NO_GIT_REFERENCES</div>
  }

  return (
    <div className="space-y-3">
      {refs.map((a) => {
        const nv = a.newValue || {}
        const isPr = a.action === "git_pr"
        const url = nv.url ? String(nv.url) : null
        return (
          <div key={a.id} className="border border-[var(--br-border)] bg-[var(--br-bg-secondary)] p-3">
            <div className="flex items-start gap-2">
              <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-mono border ${
                isPr
                  ? "border-[var(--br-warn)] text-[var(--br-warn)]"
                  : "border-[var(--br-accent)] text-[var(--br-accent)]"
              }`}>
                {isPr ? `PR #${String(nv.number || "")}` : String(nv.sha || "")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-[var(--br-text)] break-words">{String(nv.title || nv.message || "")}</div>
                <div className="text-[10px] text-[var(--br-text-secondary)] mt-1">
                  {isPr
                    ? `${String(nv.state || "")}${nv.merged ? " (merged)" : ""}`
                    : `commit em ${String(nv.branch || "")}`}
                  {nv.repo ? ` · ${String(nv.repo)}` : ""}
                  {nv.author ? ` · ${String(nv.author)}` : ""}
                  {" · "}
                  {new Date(a.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-2 py-1 border border-[var(--br-border)] text-[var(--br-accent)] text-[10px] hover:border-[var(--br-accent)] transition-colors"
                >
                  [ VER ]
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ==================== GIT POWER UP MODAL ====================
function GitPowerUpModal({ onClose, onChanged }: { onClose: () => void; onChanged?: () => void }) {
  const [integrations, setIntegrations] = useState<GitIntegration[] | null>(null)
  const [provider, setProvider] = useState<"github" | "gitlab">("github")
  const [repo, setRepo] = useState("")
  const [token, setToken] = useState("")
  const [error, setError] = useState("")

  const webhookUrl = `${window.location.origin}/api/webhooks/github`

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/git-integrations")
      const data = await res.json().catch(() => ({ integrations: [] }))
      setIntegrations(data.integrations || [])
    } catch {
      setIntegrations([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleAdd = async () => {
    setError("")
    const repoName = repo.trim()
    if (!repoName) {
      setError("ERRO: informe o repositório no formato owner/repo")
      return
    }
    try {
      const res = await fetch("/api/git-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, repositoryFullName: repoName, accessToken: token.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(String(data.error || "ERRO: FALHA_AO_VINCULAR_REPOSITORIO"))
        return
      }
      setRepo("")
      setToken("")
      await load()
    } catch {
      setError("ERRO: FALHA_DE_COMUNICACAO")
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/git-integrations?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      await load()
    } catch {
      setError("ERRO: FALHA_AO_REMOVER")
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--br-overlay)] z-50 flex items-center justify-center p-4">
      <div className="border-2 border-[var(--br-accent)] bg-[var(--br-bg)] max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="text-[var(--br-warn)] font-bold text-sm">{">"} GIT_POWER_UP</div>
          <button onClick={onClose} className="text-[var(--br-text-secondary)] text-xs border border-[var(--br-border)] px-2 py-1 hover:border-[var(--br-accent)] transition-colors">
            [ FECHAR ]
          </button>
        </div>

        <div className="border border-[var(--br-border)] bg-[var(--br-bg-secondary)] p-4 mb-5">
          <div className="text-[var(--br-accent)] text-xs mb-2">{">"} WEBHOOK_URL (configurar no GitHub: repo → Settings → Webhooks):</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[10px] text-[var(--br-text)] break-all bg-[var(--br-bg)] border border-[var(--br-border)] px-2 py-1.5">
              {webhookUrl}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(webhookUrl).catch(() => {}) }}
              className="shrink-0 px-2 py-1.5 border border-[var(--br-border)] text-[var(--br-accent)] text-[10px] hover:border-[var(--br-accent)] transition-colors"
            >
              [ COPIAR ]
            </button>
          </div>
        </div>

        <div className="border border-[var(--br-border)] p-4 mb-5">
          <div className="text-[var(--br-accent)] text-xs mb-3">{">"} VINCULAR_REPOSITORIO:</div>
          <div className="flex items-center gap-2 mb-3">
            {(["github", "gitlab"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`h-8 px-3 text-xs border transition-colors ${
                  provider === p
                    ? "border-[var(--br-accent)] bg-[var(--br-accent)] text-black font-bold"
                    : "border-[var(--br-border)] text-[var(--br-text-secondary)] hover:border-[var(--br-accent)]"
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
          <input
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
            placeholder="owner/repo"
            className="w-full h-10 bg-[var(--br-bg)] border border-[var(--br-border)] px-3 text-xs text-[var(--br-text)] mb-2 focus:outline-none focus:border-[var(--br-accent)]"
          />
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
            placeholder="Token (opcional)"
            type="password"
            className="w-full h-10 bg-[var(--br-bg)] border border-[var(--br-border)] px-3 text-xs text-[var(--br-text)] mb-3 focus:outline-none focus:border-[var(--br-accent)]"
          />
          <button onClick={handleAdd} className="w-full h-10 border border-[var(--br-warn)] text-[var(--br-warn)] text-xs hover:bg-[var(--br-warn)] hover:text-black transition-colors">
            [ VINCULAR ]
          </button>
          {error && <div className="text-[var(--br-danger)] text-[10px] mt-2">{error}</div>}
        </div>

        <div className="text-[var(--br-accent)] text-xs mb-3">{">"} REPOSITORIOS_VINCULADOS:</div>
        {integrations === null ? (
          <div className="text-[var(--br-accent)]/50 text-xs">CARREGANDO...</div>
        ) : integrations.length === 0 ? (
          <div className="text-[var(--br-accent)]/50 text-xs">NO_REPOSITORIES</div>
        ) : (
          <div className="space-y-2">
            {integrations.map((i) => (
              <div key={i.id} className="border border-[var(--br-border)] bg-[var(--br-bg-secondary)] p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-[var(--br-text)]">
                    <span className="text-[var(--br-accent)]">{i.provider.toUpperCase()}</span> · {i.repositoryFullName}
                  </div>
                  <div className="text-[10px] text-[var(--br-text-secondary)] mt-1">
                    TOKEN: {i.tokenConfigured ? "CONFIGURADO" : "NAO_CONFIGURADO"}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(i.id)}
                  className="shrink-0 px-2 py-1 border border-[var(--br-danger)] text-[var(--br-danger)] text-[10px] hover:bg-[var(--br-danger)] hover:text-black transition-colors"
                >
                  [ REMOVER ]
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== TASK EDIT MODAL ====================
function TaskEditModal({
  task,
  team,
  currentUser,
  workspaceLabels,
  focusSubtasks,
  focusSubtaskId,
  onClose,
  onSave,
  onAddComment,
  onEditComment,
  onUploadComplete,
}: {
  task: Task
  team: TeamMember[]
  currentUser: TeamMember
  workspaceLabels: Label[]
  focusSubtasks?: boolean
  focusSubtaskId?: string | null
  onClose: () => void
  onSave: (updates: Partial<Task>) => void
  onAddComment: (content: string, mentions: string[]) => void
  onEditComment?: (commentId: string, content: string) => void
  onUploadComplete?: () => void
}) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [assignees, setAssignees] = useState<string[]>(task.assignees)
  const [taskAssigneeId, setTaskAssigneeId] = useState<string | null>(task.assigneeId || null)
  const [labels, setLabels] = useState<Label[]>(task.labels)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newComment, setNewComment] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState("")
  const [showNewSubtask, setShowNewSubtask] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [newSubtaskEstHours, setNewSubtaskEstHours] = useState("")
  const [improving, setImproving] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [subtasksCollapsed, setSubtasksCollapsed] = useState(false)
  const [focusFlash, setFocusFlash] = useState(false)
  const [activeTab, setActiveTab] = useState<"details" | "activity" | "git">("details")
  const subtasksSectionRef = useRef<HTMLDivElement | null>(null)
  const subtasksScrolledRef = useRef(false)

  const [descEditing, setDescEditing] = useState(false)
  const [descSaveState, setDescSaveState] = useState<"idle" | "saving" | "saved">("idle")
  const descTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const descStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const descDirtyRef = useRef(false)

  const persistDescription = async () => {
    if (descTimerRef.current) {
      clearTimeout(descTimerRef.current)
      descTimerRef.current = null
    }
    if (!descDirtyRef.current) return
    descDirtyRef.current = false
    setDescSaveState("saving")
    try {
      await onSave({ description })
      setDescSaveState("saved")
      if (descStatusTimerRef.current) clearTimeout(descStatusTimerRef.current)
      descStatusTimerRef.current = setTimeout(() => setDescSaveState("idle"), 2000)
    } catch {
      descDirtyRef.current = true
      setDescSaveState("idle")
    }
  }

  const scheduleDescriptionSave = () => {
    descDirtyRef.current = true
    setDescSaveState("saving")
    if (descTimerRef.current) clearTimeout(descTimerRef.current)
    descTimerRef.current = setTimeout(persistDescription, 2000)
  }

  const handleDescChange = (value: string) => {
    setDescription(value)
    scheduleDescriptionSave()
  }

  useEffect(() => {
    return () => {
      if (descTimerRef.current) clearTimeout(descTimerRef.current)
      if (descStatusTimerRef.current) clearTimeout(descStatusTimerRef.current)
    }
  }, [])

  useEffect(() => {
    fetch(`/api/subtasks?taskId=${task.id}`)
      .then((r) => r.json())
      .then((d) => setSubtasks(d.subtasks || []))
      .catch(() => {})
  }, [task.id])

  // "Ver subtarefas": expande a seção e rola até ela, com destaque temporário
  useEffect(() => {
    if (!focusSubtasks || subtasksScrolledRef.current || subtasks.length === 0) return
    subtasksScrolledRef.current = true
    setSubtasksCollapsed(false)
    const scrollTimer = setTimeout(() => {
      subtasksSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      setFocusFlash(true)
    }, 150)
    const flashTimer = setTimeout(() => setFocusFlash(false), 2000)
    return () => {
      clearTimeout(scrollTimer)
      clearTimeout(flashTimer)
    }
  }, [focusSubtasks, subtasks.length])

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

  const handleTaskAssigneeChange = async (assigneeId: string | null) => {
    setTaskAssigneeId(assigneeId)
    try {
      await onSave({ assigneeId })
    } catch {
      setTaskAssigneeId(task.assigneeId || null)
    }
  }

  const handleSubtaskAssigneeUpdate = async (subtaskId: string, assigneeId: string | null) => {
    try {
      await fetch("/api/subtasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subtaskId, assigneeId }),
      })
      const res = await fetch(`/api/subtasks?taskId=${task.id}`)
      const d = await res.json()
      setSubtasks(d.subtasks || [])
    } catch (err) {
      console.error("Error updating subtask assignee:", err)
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
      if (data?.improved) {
        setDescription(data.improved)
        scheduleDescriptionSave()
      }
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

  const [copied, setCopied] = useState(false)
  const copyLink = async () => {
    const url = `${window.location.origin}/board/${DEFAULT_WORKSPACE_ID}/task/${task.id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
    setCopied(true)
    showToast("LINK_COPIADO", "success")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="w-full max-w-[1100px] max-h-[95vh] flex flex-col bg-[var(--br-bg)] border border-[var(--br-border-strong)] rounded-xl shadow-2xl overflow-hidden mx-auto">
          <div className="border-b border-[var(--br-border)] p-4 flex justify-between items-center bg-[var(--br-bg)] z-10 shrink-0">
            <span className="text-[var(--br-accent)] font-bold">{">"} EDIT_TASK</span>
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                title="Copiar link de compartilhamento da tarefa"
                className="text-[var(--br-accent)]/80 hover:bg-[var(--br-accent)] hover:text-black px-3 py-1 border border-[var(--br-accent)]/50 hover:border-[var(--br-accent)] transition-colors text-xs"
              >
                [ {copied ? "COPIADO ✓" : "COPIAR_LINK"} ]
              </button>
              <button
                onClick={handleSave}
                className="text-[var(--br-accent)] hover:bg-[var(--br-accent)] hover:text-black px-3 py-1 border border-[var(--br-accent)] transition-colors text-xs"
              >
                [ SAVE ]
              </button>
              <button
                onClick={onClose}
                className="text-[var(--br-danger)] hover:bg-[var(--br-danger)] hover:text-black px-2 py-1 border border-[var(--br-danger)] transition-colors text-xs"
              >
                [ CLOSE ]
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto flex flex-col lg:border-r border-[var(--br-border)]">
              <div className="flex gap-1 px-4 pt-3 border-b border-[var(--br-border)] shrink-0">
            <button
              onClick={() => setActiveTab("details")}
              className={`h-8 px-3 text-xs border-t border-l border-r rounded-t-md transition-colors ${
                activeTab === "details"
                  ? "border-[var(--br-accent)] bg-[var(--br-accent)] text-black font-bold"
                  : "border-[var(--br-border)] text-[var(--br-text-secondary)] hover:border-[var(--br-accent)]"
              }`}
            >
              [ DETALHES ]
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`h-8 px-3 text-xs border-t border-l border-r rounded-t-md transition-colors ${
                activeTab === "activity"
                  ? "border-[var(--br-accent)] bg-[var(--br-accent)] text-black font-bold"
                  : "border-[var(--br-border)] text-[var(--br-text-secondary)] hover:border-[var(--br-accent)]"
              }`}
            >
              [ ATIVIDADE ]
            </button>
            <button
              onClick={() => setActiveTab("git")}
              className={`h-8 px-3 text-xs border-t border-l border-r rounded-t-md transition-colors ${
                activeTab === "git"
                  ? "border-[var(--br-accent)] bg-[var(--br-accent)] text-black font-bold"
                  : "border-[var(--br-border)] text-[var(--br-text-secondary)] hover:border-[var(--br-accent)]"
              }`}
            >
              [ GIT ]
            </button>
          </div>

          {activeTab === "activity" ? (
            <div className="p-4">
              <div className="text-[var(--br-accent)] text-xs mb-3">{">"} HISTORICO_DE_ATIVIDADES:</div>
              <div className="max-h-[55vh] overflow-y-auto pr-1">
                <ActivityFeed taskId={task.id} />
              </div>
            </div>
          ) : activeTab === "git" ? (
            <div className="p-4">
              <div className="text-[var(--br-accent)] text-xs mb-3">{">"} COMMITS_E_PRS_REFERENCIADOS (via #&lt;taskId&gt;):</div>
              <div className="max-h-[55vh] overflow-y-auto pr-1">
                <GitReferences taskId={task.id} />
              </div>
            </div>
          ) : (
          <div className="p-4 space-y-6">
            <div>
              <div className="text-[var(--br-accent)] text-xs mb-2">{">"} TITLE:</div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base focus:border-[var(--br-accent)] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="text-[var(--br-accent)] text-xs">{">"} DESCRIPTION:</div>
                  {descSaveState === "saving" && (
                    <span className="text-[10px] text-[var(--br-warn)] animate-pulse">SALVANDO...</span>
                  )}
                  {descSaveState === "saved" && (
                    <span className="text-[10px] text-[var(--br-accent)]">✓ SALVO</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={improveDescription}
                    disabled={improving || !description.trim()}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] border border-[var(--br-border)] rounded hover:border-[var(--br-accent-strong)] hover:text-[var(--br-accent-strong)] text-[var(--br-text-secondary)] transition-all disabled:opacity-40"
                  >
                    {improving ? (
                      <span className="animate-pulse">✦ melhorando...</span>
                    ) : (
                      <>✦ melhorar com IA</>
                    )}
                  </button>
                  {!descEditing && (
                    <button
                      onClick={() => setDescEditing(true)}
                      title="Editar descrição"
                      className="w-6 h-6 flex items-center justify-center border border-[var(--br-border)] text-[var(--br-accent)]/60 hover:border-[var(--br-accent)] hover:text-[var(--br-accent)] transition-colors text-xs"
                    >
                      ✎
                    </button>
                  )}
                </div>
              </div>
              {descEditing ? (
                <textarea
                  value={description}
                  onChange={(e) => handleDescChange(e.target.value)}
                  onBlur={persistDescription}
                  autoFocus
                  rows={10}
                  className="w-4/5 h-[200px] px-3 py-2 bg-[var(--br-bg-secondary)] border border-[var(--br-accent)] text-[var(--br-text)] text-base focus:outline-none resize-y transition-all duration-200"
                />
              ) : (
                <div
                  onDoubleClick={() => setDescEditing(true)}
                  className="w-full min-h-[6rem] max-h-[12rem] overflow-y-auto px-3 py-2 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base whitespace-pre-wrap break-words cursor-text hover:border-[var(--br-accent)]/50 transition-colors"
                >
                  {description ? description : (
                    <span className="text-[var(--br-accent)]/30">NO_DESCRIPTION</span>
                  )}
                </div>
              )}
            </div>




            <div
              ref={subtasksSectionRef}
              className={`transition-colors ${focusFlash ? "border border-[var(--br-accent)] p-2" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setSubtasksCollapsed(!subtasksCollapsed)}
                  className="text-[var(--br-accent)] text-xs hover:text-[var(--br-accent)]/70 transition-colors"
                  title={subtasksCollapsed ? "Expandir subtarefas" : "Recolher subtarefas"}
                >
                  {">"} SUBTASKS: {subtasksCollapsed ? "[ ▼ ]" : "[ ▲ ]"}
                </button>
                <div className="text-[var(--br-accent)]/50 text-[10px]">
                  EST: {totalEstimatedHours}h | REAL: {formatTime(totalTimeSpent)}
                </div>
              </div>

              {!subtasksCollapsed && (
                <>
              {totalEstimatedHours > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-[var(--br-accent)]/50 mb-1">
                    <span>Estimado total: {totalEstimatedHours}h</span>
                    <span>Realizado total: {formatTime(totalTimeSpent)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--br-border)]">
                    <div
                      className="h-full bg-[var(--br-accent)] transition-all"
                      style={{ width: `${Math.min((totalTimeSpent / (totalEstimatedHours * 3600)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 mb-3">
                {subtasks.length === 0 && (
                  <div className="text-[var(--br-accent)]/50 text-xs">NO_SUBTASKS</div>
                )}
                {subtasks.map((st) => (
                  <SubtaskRow
                    key={st.id}
                    subtask={st}
                    onUpdateStatus={handleSubtaskStatusUpdate}
                    onAddComment={handleSubtaskComment}
                    onUploadComplete={onUploadComplete}
                    onUpdateAssignee={handleSubtaskAssigneeUpdate}
                    currentUser={currentUser}
                    team={team}
                    highlight={focusSubtaskId === st.id}
                  />
                ))}
              </div>

              {showNewSubtask ? (
                <div className="border border-[var(--br-accent)] p-3 space-y-2">
                  <input value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="SUBTASK_TITLE..."
                    className="w-full h-10 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-sm placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none" />
                  <input value={newSubtaskEstHours} onChange={(e) => setNewSubtaskEstHours(e.target.value)}
                    placeholder="ESTIMATED_HOURS (ex: 2.5)"
                    type="number" step="0.5" min="0"
                    className="w-full h-10 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-sm placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none" />
                  <div className="flex gap-2">
                    <button onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}
                      className="flex-1 h-10 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors disabled:opacity-50">[ ADD ]</button>
                    <button onClick={() => setShowNewSubtask(false)}
                      className="h-10 px-3 border border-[var(--br-border)] text-[var(--br-accent)]/50 text-xs hover:border-[var(--br-accent)] transition-colors">[ CANCEL ]</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowNewSubtask(true)}
                  className="w-full h-10 border border-dashed border-[var(--br-border)] text-[var(--br-accent)]/50 text-xs hover:border-[var(--br-accent)] hover:text-[var(--br-accent)] transition-colors">
                  [ + ADD_SUBTASK ]
                </button>
              )}
                </>
              )}
            </div>

            <div>
              <div className="text-[var(--br-accent)] text-xs mb-2">{">"} FILES:</div>
              <div className="space-y-2 mb-3">
                {task.files.length === 0 ? (
                  <div className="text-[var(--br-accent)]/50 text-xs">NO_FILES</div>
                ) : (
                  task.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between border border-[var(--br-border)] bg-[var(--br-bg-secondary)] p-2"
                    >
                      <a href={file.url} target="_blank" rel="noopener noreferrer"
                        className="text-[var(--br-accent)] text-xs hover:underline truncate flex-1">{file.name}</a>
                      <span className="text-[var(--br-accent)]/50 text-xs ml-2 shrink-0">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-[var(--br-border)] hover:border-[var(--br-accent)] p-3 transition-colors">
                <span className="text-[var(--br-accent)] text-xs">[ UPLOAD_FILE ]</span>
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

            <div className="border border-[var(--br-border)] p-3">
              <div className="text-[var(--br-accent)] text-xs mb-3">{">"} COMMENT_HISTORY:</div>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {task.comments.length === 0 ? (
                  <div className="text-[var(--br-accent)]/50 text-xs">NO_COMMENTS</div>
                ) : (
                  task.comments.map((comment) => (
                    <div key={comment.id} className="border border-[var(--br-border)] bg-[var(--br-bg-secondary)] p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MemberAvatar name={team.find((m) => m.username === comment.authorName || m.name === comment.authorName)?.name || comment.authorName} url={team.find((m) => m.username === comment.authorName || m.name === comment.authorName)?.avatarUrl} />
                        <span className="text-[var(--br-accent)] text-xs font-bold">{comment.authorName}</span>
                        <span className="text-[var(--br-accent)]/50 text-xs">
                          {new Date(comment.createdAt).toLocaleString("pt-BR")}
                        </span>
                        {comment.authorName === currentUser.username && (
                          <button onClick={() => {
                            if (editingCommentId === comment.id) { setEditingCommentId(null) }
                            else { setEditingCommentId(comment.id); setEditingCommentContent(comment.content) }
                          }}
                            className="ml-auto text-[var(--br-accent)]/50 hover:text-[var(--br-accent)] text-xs px-1 border border-[var(--br-border)] hover:border-[var(--br-accent)] transition-colors">[ EDIT ]</button>
                        )}
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <textarea value={editingCommentContent} onChange={(e) => setEditingCommentContent(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-[var(--br-bg)] border border-[var(--br-accent)] text-[var(--br-text)] text-sm focus:outline-none resize-none" />
                          <div className="flex gap-2">
                            <button onClick={() => handleEditComment(comment.id)} disabled={!editingCommentContent.trim()}
                              className="flex-1 h-8 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors disabled:opacity-50">[ SAVE_EDIT ]</button>
                            <button onClick={() => setEditingCommentId(null)}
                              className="h-8 px-3 border border-[var(--br-border)] text-[var(--br-accent)]/50 text-xs hover:border-[var(--br-accent)] transition-colors">[ CANCEL ]</button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[var(--br-text)] text-sm break-words">{comment.content}</div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="text-[var(--br-accent)] text-xs mb-2">{">"} NEW_COMMENT (use @ para mencionar):</div>
              <MentionInput value={newComment} onChange={setNewComment}
                onSubmit={handleAddComment} team={team} placeholder="Digite seu comentário..." />
            </div>

          </div>
          )}
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
  isAprovadoColumn,
  showSubtasks,
  team,
  onSubtaskStatusChange,
  onSubtaskAssigneeChange,
  onCoverClick,
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
  isAprovadoColumn?: boolean
  showSubtasks?: boolean
  team: TeamMember[]
  onSubtaskStatusChange: (subtaskId: string, newStatus: string) => void
  onSubtaskAssigneeChange: (subtaskId: string, assigneeId: string | null) => void
  onCoverClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const cover = !!task.coverImageUrl
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      onClick={onEdit}
      style={cover
        ? { ...style, backgroundImage: `url("${task.coverImageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }
        : style}
      className={`border p-3 rounded-md shadow-sm cursor-pointer transition-all hover:shadow-md relative overflow-hidden ${
        task.isComplete
          ? "bg-[var(--br-accent-strong)] border-[var(--br-accent-strong)]"
          : "border-[var(--br-border)] bg-[var(--br-bg-secondary)] hover:border-[var(--br-accent)]/50"
      }`}
    >
      {cover && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.8))" }}
        />
      )}
      <div className="relative z-10">
      {isAprovadoColumn || task.isComplete ? (
        <button
          onClick={(e) => { e.stopPropagation(); if (isAprovadoColumn) onToggleComplete?.() }}
          className={`absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-sm z-10 transition-colors ${
            task.isComplete
              ? "text-[#0a0a0a]"
              : "text-[var(--br-text-secondary)] hover:text-[var(--br-accent-strong)]"
          } ${!isAprovadoColumn && task.isComplete ? "cursor-default" : ""}`}
          title={
            !isAprovadoColumn && task.isComplete
              ? "Concluída"
              : task.isComplete
                ? "Marcar como pendente"
                : "Marcar como concluída"
          }
        >
          {task.isComplete ? "✓" : "○"}
        </button>
      ) : null}
      <div {...attributes} {...listeners} className={`text-xs mb-1 cursor-grab active:cursor-grabbing select-none ${cover ? "text-white/40" : task.isComplete ? "text-[var(--br-accent-muted)]" : "text-[var(--br-accent)]/30"}`}>
        ⠿ {task.title ? "DRAG" : ""}
      </div>
      {task.labels.length > 0 && (
        <div className={`flex flex-wrap gap-1 mb-2 ${task.isComplete ? "opacity-70" : ""}`}>
          {task.labels.map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
        </div>
      )}

      <div className={`font-bold text-sm mb-2 break-words ${cover ? "text-white" : task.isComplete ? "text-[#0a0a0a] line-through" : "text-[var(--br-text)]"}`}>{task.title}</div>
      {task.description && (
        <div className={`text-xs mb-3 break-words whitespace-pre-wrap overflow-y-auto h-[4.5rem] ${cover ? "text-white/85" : task.isComplete ? "text-[#0a0a0a]" : "text-[var(--br-text)]/70"}`}>{task.description}</div>
      )}

      <div className={`text-xs mb-3 flex flex-wrap items-center gap-1 ${cover ? "text-white/90" : task.isComplete ? "text-[var(--br-accent-muted)]" : "text-[var(--br-accent)]"}`}>
        {task.assigneeId ? (
          <MemberAvatar
            name={team.find((m) => m.id === task.assigneeId)?.name || "—"}
            url={team.find((m) => m.id === task.assigneeId)?.avatarUrl || null}
            size={20}
          />
        ) : (
          task.assignees.map((assignee, i) => {
            const display = assignee.startsWith("@") ? assignee : `@${assignee.toLowerCase().replace(/\s+/g, "_")}`
            return <span key={i}>{display}{i < task.assignees.length - 1 ? "," : ""}</span>
          })
        )}
      </div>

      {task.comments.length > 0 && (
        <div className={`text-xs mb-3 ${cover ? "text-white/75" : task.isComplete ? "text-[var(--br-accent-muted)]/70" : "text-[var(--br-accent)]/50"}`}>[ {task.comments.length} COMMENT{task.comments.length > 1 ? "S" : ""} ]</div>
      )}
      {task.files && task.files.length > 0 && (
        <div className={`text-xs mb-3 ${cover ? "text-white/75" : task.isComplete ? "text-[var(--br-accent-muted)]/70" : "text-[var(--br-accent)]/50"}`}>[ {task.files.length} FILE{task.files.length > 1 ? "S" : ""} ]</div>
      )}
      {task.subtaskCount !== undefined && task.subtaskCount > 0 && (
        <div className={`text-xs mb-3 ${cover ? "text-white/75" : task.isComplete ? "text-[var(--br-accent-muted)]/70" : "text-[var(--br-accent)]/50"}`}>
          [ {task.subtaskCount} SUBTASK{(task.subtaskCount || 0) > 1 ? "S" : ""} ]
          {(task.totalEstimatedHours || 0) > 0 && <> | EST: {task.totalEstimatedHours}h</>}
          {(task.totalTimeSpent || 0) > 0 && (
            <> | REAL: {Math.floor((task.totalTimeSpent || 0) / 3600)}h {Math.floor(((task.totalTimeSpent || 0) % 3600) / 60)}m</>
          )}
        </div>
      )}

      {showSubtasks && (task.subtasks || []).length > 0 && (
        <div className="mb-3" onClick={(e) => e.stopPropagation()}>
          <div className={`text-[10px] mb-1.5 ${cover ? "text-white/60" : task.isComplete ? "text-[var(--br-accent-muted)]/60" : "text-[var(--br-accent)]/40"}`}>
            {">"} SUBTAREFAS:
          </div>
          <div className="space-y-2">
            {(task.subtasks || []).map((st) => (
              <SubtaskCard
                key={st.id}
                subtask={st}
                team={team}
                onStatusChange={onSubtaskStatusChange}
                onAssigneeChange={onSubtaskAssigneeChange}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-1 mr-1">
          <button
            onClick={() => onMoveVertical("up")}
            disabled={taskIndex === 0}
            className="h-6 w-6 border border-[var(--br-border)] text-[var(--br-accent)] text-xs hover:border-[var(--br-accent)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          >▲</button>
          <button
            onClick={() => onMoveVertical("down")}
            disabled={taskIndex === totalTasks - 1}
            className="h-6 w-6 border border-[var(--br-border)] text-[var(--br-accent)] text-xs hover:border-[var(--br-accent)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          >▼</button>
        </div>
        {columnIndex > 0 && (
          <button onClick={() => onMove("left")} className="h-8 px-2 border border-[var(--br-border)] text-[var(--br-accent)] text-xs hover:border-[var(--br-accent)] transition-colors">←</button>
        )}
        {columnIndex < totalColumns - 1 && (
          <button onClick={() => onMove("right")} className="h-8 px-2 border border-[var(--br-border)] text-[var(--br-accent)] text-xs hover:border-[var(--br-accent)] transition-colors">→</button>
        )}
        <button onClick={onDelete} className="h-8 px-2 border border-[var(--br-danger)]/50 text-[var(--br-danger)] text-xs hover:border-[var(--br-danger)] hover:bg-[var(--br-danger)] hover:text-black transition-colors ml-auto">DEL</button>
        <button onClick={onCoverClick} className="h-8 px-2 border border-[var(--br-border)] text-[var(--br-accent)] text-xs hover:border-[var(--br-accent)] transition-colors" title="Adicionar capa">CAPA</button>
        {onCancel && <button onClick={onCancel} className="h-8 px-2 border border-[var(--br-danger)] text-[var(--br-danger)] text-xs hover:bg-[var(--br-danger)] hover:text-black transition-colors">✕</button>}
      </div>
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
    <div className="border border-[var(--br-accent)] p-3 mt-3">
      <div className="text-[var(--br-accent)] text-xs mb-3">{">"} NEW_TASK_ENTRY</div>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="TITLE..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full h-12 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none"
        />
        <textarea
          placeholder="DESCRIPTION..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none resize-none"
        />
        <div>
          <div className="text-[var(--br-accent)] text-xs mb-2">{">"} SELECT_ASSIGNEES:</div>
          <div className="flex flex-wrap gap-2">
            {team.map((member) => (
              <button
                key={member.id}
                onClick={() => toggleAssignee(member.name)}
                className={`px-2 py-1 border text-xs transition-colors ${
                  assignees.includes(member.name)
                    ? "border-[var(--br-accent)] bg-[var(--br-accent)] text-black"
                    : "border-[var(--br-border)] text-[var(--br-text)] hover:border-[var(--br-accent)]"
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
            className="flex-1 h-12 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            [ CREATE ]
          </button>
          <button
            onClick={onCancel}
            className="h-12 px-4 border border-[var(--br-border)] text-[var(--br-accent)]/50 text-xs hover:border-[var(--br-accent)] transition-colors"
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
    <div className="fixed inset-0 bg-[var(--br-overlay)] z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="border border-[var(--br-border-strong)] rounded-lg shadow-xl bg-[var(--br-bg)] max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[var(--br-accent)] font-bold text-sm">{">"} NOVA_TAREFA</span>
          {backlogColumn && (
            <span className="text-[10px] text-[var(--br-accent)]/60 border border-[var(--br-accent)]/30 px-2 py-0.5">
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
            className="w-full h-12 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none"
          />
          <textarea
            placeholder="DESCRIÇÃO (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none resize-none"
          />
          <div>
            <div className="text-[var(--br-accent)] text-xs mb-2">{">"} SELECT_ASSIGNEES:</div>
            <div className="flex flex-wrap gap-2">
              {team.map((member) => (
                <button
                  key={member.id}
                  onClick={() => toggleAssignee(member.name)}
                  className={`px-2 py-1 border text-xs transition-colors ${
                    assignees.includes(member.name)
                      ? "border-[var(--br-accent)] bg-[var(--br-accent)] text-black"
                      : "border-[var(--br-border)] text-[var(--br-text)] hover:border-[var(--br-accent)]"
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
              className="flex-1 h-12 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "CRIANDO..." : "[ CRIAR ]"}
            </button>
            <button
              onClick={onClose}
              className="h-12 px-4 border border-[var(--br-border)] text-[var(--br-accent)]/50 text-xs hover:border-[var(--br-accent)] transition-colors"
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
        isOver ? "border-[var(--br-accent-strong)] bg-[rgba(0,255,136,0.06)]" : "border-[var(--br-border)]"
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
  showSubtasks,
  onSubtaskStatusChange,
  onSubtaskAssigneeChange,
  onCoverClick,
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
  showSubtasks?: boolean
  onSubtaskStatusChange: (subtaskId: string, newStatus: string) => void
  onSubtaskAssigneeChange: (subtaskId: string, assigneeId: string | null) => void
  onCoverClick: (task: Task) => void
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
    <div className="flex-shrink-0 min-w-[280px] w-[280px] md:w-[300px] lg:w-[320px] rounded-md shadow-sm border border-[var(--br-border)] bg-[var(--br-bg)] flex flex-col max-h-full overflow-hidden">
      <div className="border-b border-[var(--br-border)] p-3 flex items-center justify-between bg-[var(--br-bg-secondary)]">
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
                className="w-full bg-[#0a0a0a] border rounded px-1.5 py-0.5 text-xs text-[var(--br-text)] focus:outline-none"
              />
              {nameSaving && <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-[var(--br-accent-strong)] animate-pulse">✓</span>}
              {nameError && <div className="absolute top-full left-0 mt-1 text-[10px] text-[var(--br-danger)] bg-[var(--br-danger-bg)] border border-[var(--br-danger-border)] rounded px-2 py-1 z-50 whitespace-nowrap">{nameError}</div>}
            </div>
          ) : (
            <span
              onClick={() => { setNameDraft(column.name); setEditingName(true); setTimeout(() => nameInputRef.current?.select(), 50) }}
              className="text-[var(--br-accent)] font-bold text-sm truncate cursor-pointer hover:text-[var(--br-accent-strong)] transition-colors"
              title="Clique para renomear"
            >{column.name}</span>
          )}
          <span className="text-[var(--br-accent)]/50 text-xs shrink-0">[{column.tasks.length}]</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onMoveColumn && columnPosition !== undefined && (
            <>
              <button
                onClick={() => onMoveColumn("left")}
                disabled={columnPosition === 0}
                className="h-5 w-5 border border-[var(--br-border)] text-[var(--br-accent)] text-[10px] hover:border-[var(--br-accent)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >◀</button>
              <button
                onClick={() => onMoveColumn("right")}
                disabled={columnPosition === (allColumnsCount ?? totalColumns) - 1}
                className="h-5 w-5 border border-[var(--br-border)] text-[var(--br-accent)] text-[10px] hover:border-[var(--br-accent)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >▶</button>
            </>
          )}
          {!isDefault && (
            <button onClick={onDeleteColumn} className="text-[var(--br-danger)]/50 hover:text-[var(--br-danger)] text-xs transition-colors px-1">×</button>
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
              isAprovadoColumn={column.name === "APROVADO"}
              showSubtasks={showSubtasks}
              team={team}
              onSubtaskStatusChange={onSubtaskStatusChange}
              onSubtaskAssigneeChange={onSubtaskAssigneeChange}
              onCoverClick={() => onCoverClick(task)}
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
    <div className="flex-shrink-0 min-w-[280px] w-[280px] md:w-[300px] lg:w-[320px] rounded-md border border-[var(--br-accent)] p-4 bg-[var(--br-bg)] shadow-md">
      <div className="text-[var(--br-accent)] text-xs mb-3">{">"} NEW_COLUMN</div>
      <input
        type="text"
        placeholder="COLUMN_NAME..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full h-12 px-3 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-base placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none mb-3"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={() => title.trim() && onSubmit(title.trim().toUpperCase())}
          disabled={!title.trim()}
          className="flex-1 h-10 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors disabled:opacity-50"
        >
          [ CREATE ]
        </button>
        <button
          onClick={onCancel}
          className="h-10 px-3 border border-[var(--br-border)] text-[var(--br-accent)]/50 text-xs hover:border-[var(--br-accent)] transition-colors"
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
  onToggleGitPowerUp,
  showTeam,
}: {
  currentUser: TeamMember
  notifications: Notification[]
  onLogout: () => void
  onToggleTeam: () => void
  onToggleNotifications: () => void
  onEditProfile: () => void
  onToggleGitPowerUp: () => void
  showTeam: boolean
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <header className="border-b-2 border-[var(--br-accent)] bg-[var(--br-bg)] sticky top-0 z-40">
      <div className="px-3 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--br-accent)]">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-8 h-8 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] flex items-center justify-center mr-2"
            >
              <span className="text-[var(--br-text-secondary)] text-xs">{mobileMenuOpen ? "✕" : "☰"}</span>
            </button>
            <span className="text-lg md:text-xl font-bold">BRO.LABS</span>
            <span className="text-[var(--br-accent)]/50 text-xs hidden sm:inline">
              {"// BROLABTASK_CLI_v2.0"}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="border border-[var(--br-border)] px-3 py-2 text-xs flex items-center gap-2">
              <MemberAvatar name={currentUser.name} url={currentUser.avatarUrl} />
              <span>
                <span className="text-[var(--br-accent)]/50">USER:</span>
                <span className="text-[var(--br-text)] ml-2">@{currentUser.username}</span>
              </span>
              {currentUser.isAdmin && (
                <span className="text-[var(--br-danger)] ml-2">[ADMIN]</span>
              )}
            </div>

            <NotificationBell
              notifications={notifications}
              onOpen={onToggleNotifications}
            />

            <button
              onClick={onEditProfile}
              className="h-10 px-3 border border-[var(--br-border)] text-[var(--br-accent)] text-xs hover:border-[var(--br-accent)] transition-colors"
            >
              [ EDIT_PROFILE ]
            </button>

            <button
              onClick={onToggleGitPowerUp}
              className="h-10 px-3 border border-[var(--br-border)] text-[var(--br-warn)] text-xs hover:border-[var(--br-warn)] transition-colors"
            >
              [ GIT_POWER_UP ]
            </button>

            <div className="h-10 flex items-center gap-1 border border-[var(--br-border)] px-1" title="Tema da interface">
              <span className="text-[var(--br-text-secondary)] text-[10px] px-1">TEMA:</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as ThemeName)}
                className="h-full bg-transparent text-[var(--br-accent)] text-xs focus:outline-none"
              >
                <option value="dark">ESCURO</option>
                <option value="clean">CLARO_CLEAN</option>
                <option value="warm">CLARO_WARM</option>
              </select>
            </div>

            <button
              onClick={onToggleTeam}
              className={`h-10 px-3 border text-xs transition-colors ${
                showTeam
                  ? "border-[var(--br-accent)] bg-[var(--br-accent)] text-black"
                  : "border-[var(--br-accent)] bg-[var(--br-bg)] text-[var(--br-accent)] hover:bg-[var(--br-border)]"
              }`}
            >
              [ VIEW_TEAM ]
            </button>

            <button
              onClick={onLogout}
              className="h-10 px-3 border border-[var(--br-danger)] text-[var(--br-danger)] text-xs hover:bg-[var(--br-danger)] hover:text-black transition-colors"
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
          <div className="md:hidden mt-3 pt-3 border-t border-[var(--br-border)] space-y-2">
            <div className="border border-[var(--br-border)] px-3 py-2 text-xs flex items-center gap-2">
              <MemberAvatar name={currentUser.name} url={currentUser.avatarUrl} />
              <span>
                <span className="text-[var(--br-accent)]/50">USER:</span>
                <span className="text-[var(--br-text)] ml-2">@{currentUser.username}</span>
              </span>
              {currentUser.isAdmin && (
                <span className="text-[var(--br-danger)] ml-2">[ADMIN]</span>
              )}
            </div>
            <button onClick={onEditProfile}
              className="w-full h-10 border border-[var(--br-border)] text-[var(--br-accent)] text-xs hover:border-[var(--br-accent)] transition-colors">[ EDIT_PROFILE ]</button>
            <button onClick={onToggleGitPowerUp}
              className="w-full h-10 border border-[var(--br-border)] text-[var(--br-warn)] text-xs hover:border-[var(--br-warn)] transition-colors">[ GIT_POWER_UP ]</button>
            <div className="flex items-center gap-2 border border-[var(--br-border)] px-2 h-10">
              <span className="text-[var(--br-text-secondary)] text-[10px]">TEMA:</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as ThemeName)}
                className="flex-1 bg-transparent text-[var(--br-accent)] text-xs focus:outline-none"
              >
                <option value="dark">ESCURO</option>
                <option value="clean">CLARO_CLEAN</option>
                <option value="warm">CLARO_WARM</option>
              </select>
            </div>
            <button onClick={onToggleTeam}
              className={`w-full h-10 border text-xs transition-colors ${
                showTeam
                  ? "border-[var(--br-accent)] bg-[var(--br-accent)] text-black"
                  : "border-[var(--br-accent)] bg-[var(--br-bg)] text-[var(--br-accent)] hover:bg-[var(--br-border)]"
              }`}>[ VIEW_TEAM ]</button>
            <button onClick={onLogout}
              className="w-full h-10 border border-[var(--br-danger)] text-[var(--br-danger)] text-xs hover:bg-[var(--br-danger)] hover:text-black transition-colors">[ EXIT_SESSION ]</button>
          </div>
        )}
      </div>
    </header>
  )
}

// ==================== LOADING SCREEN ====================
function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[var(--br-bg)] flex items-center justify-center p-4">
      <div className="border-2 border-[var(--br-accent)] p-6 md:p-10 w-full max-w-md text-center">
        <div className="text-[var(--br-accent)] text-2xl md:text-3xl font-bold mb-4">
          BRO.LABS
        </div>
        <div className="text-[var(--br-accent)]/70 text-sm mb-6">
          {">"} {message}
          <span className="animate-pulse">_</span>
        </div>
        <div className="w-full h-1 bg-[var(--br-border)]">
          <div className="h-full bg-[var(--br-accent)] animate-pulse" style={{ width: "60%" }} />
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
    <div className="fixed right-0 top-0 h-full w-80 bg-[var(--br-bg-secondary)] border-l border-[var(--br-border)] shadow-2xl z-40 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-[var(--br-border)]">
        <span className="text-[var(--br-accent)] text-xs font-bold">ARQUIVADOS</span>
        <button onClick={onClose} className="text-[var(--br-text-secondary)] hover:text-[var(--br-accent)] text-xs">✕</button>
      </div>
      <div className="p-3 border-b border-[var(--br-border)]">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-8 px-2 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-xs placeholder:text-[var(--br-accent)]/30 focus:border-[var(--br-accent)] focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="text-[var(--br-text-secondary)] text-xs text-center py-8">CARREGANDO...</div>
        ) : filtered.length === 0 ? (
          <div className="text-[var(--br-text-secondary)] text-xs text-center py-8">NENHUM CARD ARQUIVADO</div>
        ) : (
          filtered.map((card) => (
            <div key={card.id} className="bg-[var(--br-bg-secondary)] border border-[var(--br-border)] rounded p-2.5">
              <div className="text-xs text-[var(--br-text)] line-through opacity-60 font-medium">{card.title}</div>
              <div className="text-[10px] text-[var(--br-text-secondary)] mt-1">{card.columnName}</div>
              {card.labels.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {card.labels.map((l) => (
                    <span key={l.id} className="w-4 h-1.5 rounded-sm" style={{ backgroundColor: l.color }} />
                  ))}
                </div>
              )}
              <div className="text-[10px] text-[var(--br-text-secondary)] mt-1">
                {new Date(card.updatedAt).toLocaleDateString("pt-BR")}
              </div>
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => onRestore(card.id)}
                  className="flex-1 py-1 bg-[var(--br-accent-strong)] text-[#0a0a0a] text-[10px] rounded font-bold hover:bg-[var(--br-accent-strong)] transition-colors"
                >
                  RESTAURAR
                </button>
                <button
                  onClick={async () => {
                    await fetch(`/api/tasks?id=${card.id}`, { method: "DELETE" })
                    setCards(cards.filter((c) => c.id !== card.id))
                  }}
                  className="px-2 py-1 border border-[var(--br-danger)] text-[var(--br-danger)] text-[10px] rounded hover:bg-[var(--br-danger)] hover:text-[var(--br-text)] transition-colors"
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
          <div key={col.id} className="mb-4 border border-[var(--br-border)] rounded">
            <div
              onClick={() => toggleCollapse(col.id)}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--br-bg-secondary)] border-b border-[var(--br-border)] cursor-pointer hover:bg-[var(--br-hover)] transition-colors"
            >
              <span className="text-[var(--br-accent)] text-xs font-bold">{isCollapsed ? "▶" : "▼"}</span>
              <span className="text-[var(--br-text)] text-xs font-bold">{col.name}</span>
              <span className="bg-[var(--br-border)] text-[var(--br-text-secondary)] text-[10px] px-2 py-0.5 rounded-sm">{col.tasks.length}</span>
              {!showCompleted && col.tasks.filter(t => t.isComplete).length > 0 && (
                <span className="text-[var(--br-accent-strong)] text-[10px] ml-auto">+{col.tasks.filter(t => t.isComplete).length} concluída(s)</span>
              )}
            </div>
            {!isCollapsed && (
              <div className="overflow-x-auto">
                {filtered.length === 0 ? (
                  <div className="text-[var(--br-text-secondary)] text-xs p-4 text-center">Nenhuma tarefa</div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--br-border)] text-[var(--br-text-secondary)] text-[10px]">
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
                          className={`border-b border-[var(--br-border)] hover:bg-[var(--br-hover)] transition-all cursor-pointer ${
                            task.isComplete ? "bg-[var(--br-accent-strong)]/5" : "bg-[var(--br-bg-secondary)]"
                          }`}
                        >
                          <td className="p-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => { e.stopPropagation(); onToggleComplete?.(task.id) }}
                              className={`w-5 h-5 flex items-center justify-center rounded-sm transition-colors ${
                                task.isComplete ? "text-[var(--br-accent-strong)]" : "text-[var(--br-text-secondary)] hover:text-[var(--br-accent-strong)]"
                              }`}
                            >
                              {task.isComplete ? "✓" : "○"}
                            </button>
                          </td>
                          <td className={`p-2 font-medium ${task.isComplete ? "text-[var(--br-accent-strong)] line-through" : "text-[var(--br-text)]"}`}>
                            {task.title}
                          </td>
                          <td className="p-2 hidden sm:table-cell">
                            <div className="flex gap-1 flex-wrap">
                              {task.labels.slice(0, 3).map((l) => (
                                <span key={l.id} className="w-5 h-1.5 rounded-sm inline-block" style={{ backgroundColor: l.color }} />
                              ))}
                              {task.labels.length > 3 && (
                                <span className="text-[var(--br-text-secondary)] text-[10px]">+{task.labels.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-2 hidden md:table-cell">
                            <div className="flex gap-1">
                              {task.assignees.map((a, i) => (
                                <span key={i} className="w-5 h-5 bg-[var(--br-accent-strong)] rounded-sm flex items-center justify-center text-[#0a0a0a] text-[8px] font-bold">
                                  {a.charAt(0)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-2 text-[var(--br-text-secondary)] hidden lg:table-cell">
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
            className="accent-[var(--br-accent-strong)]" />
          <span className="text-[var(--br-text-secondary)] text-xs">Mostrar concluídas</span>
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
  workspaceLabels,
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
  onEditComment,
  onMarkNotificationRead,
  onClearAllNotifications,
  refreshData,
  onReorderColumns,
  checkSubtaskCompletion,
  deepLink,
  onAvatarUpdated,
}: {
  currentUser: TeamMember
  team: TeamMember[]
  columns: Column[]
  notifications: Notification[]
  workspaceLabels: Label[]
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
  checkSubtaskCompletion: (taskId: string) => Promise<boolean>
  deepLink?: { taskId: string; subtaskId?: string } | null
  onAvatarUpdated?: (avatarUrl: string) => void
}) {
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showGitPowerUp, setShowGitPowerUp] = useState(false)
  const [showNewColumnForm, setShowNewColumnForm] = useState(false)
  const [editingTask, setEditingTask] = useState<{
    task: Task
    columnId: string
    focusSubtasks?: boolean
    focusSubtaskId?: string | null
  } | null>(null)
  const [coverTask, setCoverTask] = useState<Task | null>(null)
  const deepLinkHandledRef = useRef<string | null>(null)
  const [activeTask, setActiveTask] = useState<{ task: Task; columnId: string } | null>(null)
  const [filterAssignee, setFilterAssignee] = useState<string[]>([])
  const [filterLabel, setFilterLabel] = useState<string[]>([])
  const [filterSearch, setFilterSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "complete">("all")
  const [filterMine, setFilterMine] = useState(false)
  const [pendingCloseTask, setPendingCloseTask] = useState<{
  taskId: string
  fromColumnId: string
  toColumnId: string
  newPosition?: number
} | null>(null)
  const [pendingSubtasksTask, setPendingSubtasksTask] = useState<{
    taskId: string
    pendingSubtaskIds: string[]
  } | null>(null)
  const [cancelModalTask, setCancelModalTask] = useState<Task | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [showArchived, setShowArchived] = useState(false)
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [showLabelManager, setShowLabelManager] = useState(false)
  const [labelManagerInitial, setLabelManagerInitial] = useState<string | null>(null)

  const allLabels: Label[] = workspaceLabels

  const openLabelManager = (labelId?: string) => {
    setLabelManagerInitial(labelId ?? null)
    setShowLabelManager(true)
  }

  const filteredColumns = columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((t) => {
      if (filterSearch && !t.title.toLowerCase().includes(filterSearch.toLowerCase())) return false
      if (filterAssignee.length > 0 && !t.assignees.some((a) => filterAssignee.includes(a)) && !(t.assigneeId && filterAssignee.includes(team.find((m) => m.id === t.assigneeId)?.name || ""))) return false
      if (filterMine && t.assigneeId !== currentUser.id && !t.assignees.some((a) => a === currentUser.name)) return false
      if (filterLabel.length > 0 && !t.labels.some((l) => filterLabel.includes(l.id))) return false
      if (filterStatus === "active" && t.isComplete) return false
      if (filterStatus === "complete" && !t.isComplete) return false
      return true
    }),
  }))

  const findColumnByTaskId = (taskId: string) =>
    columns.find((c) => c.tasks.some((t) => t.id === taskId))

  // Deep link (?task=...&subtask=...): abre o modal da tarefa ao carregar o board
  useEffect(() => {
    if (!deepLink || columns.length === 0) return
    if (deepLinkHandledRef.current === deepLink.taskId) return
    deepLinkHandledRef.current = deepLink.taskId
    const col = findColumnByTaskId(deepLink.taskId)
    const task = col?.tasks.find((t) => t.id === deepLink.taskId)
    if (task && col) {
      setEditingTask({
        task,
        columnId: col.id,
        focusSubtasks: !!deepLink.subtaskId,
        focusSubtaskId: deepLink.subtaskId ?? null,
      })
    } else {
      showToast("TAREFA_NAO_ENCONTRADA_OU_SEM_ACESSO", "warning")
    }
    window.history.replaceState(null, "", window.location.pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLink, columns.length])

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

  // Toggle task completion (backend valida subtarefas pendentes -> 409)
  const handleToggleComplete = async (taskId: string) => {
    const task = columns.flatMap(c => c.tasks).find(t => t.id === taskId)
    if (!task) return
    await doToggleComplete(taskId, !task.isComplete)
  }

  const doToggleComplete = async (taskId: string, complete: boolean) => {
    const task = columns.flatMap(c => c.tasks).find(t => t.id === taskId)
    if (!task) return false
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, isComplete: complete }),
    })
    const data = await res.json()
    if (!res.ok) {
      if (res.status === 409 && data?.pendingSubtaskIds?.length) {
        setPendingSubtasksTask({ taskId, pendingSubtaskIds: data.pendingSubtaskIds })
      } else {
        showToast(data?.error || "ERRO: FALHA_AO_CONCLUIR_TAREFA", "warning")
      }
      return false
    }
    refreshData()
    return true
  }

  const handleViewSubtasks = () => {
    if (!pendingSubtasksTask) return
    const taskId = pendingSubtasksTask.taskId
    const col = findColumnByTaskId(taskId)
    const task = col?.tasks.find((t) => t.id === taskId)
    setPendingSubtasksTask(null)
    if (task && col) {
      setEditingTask({ task, columnId: col.id, focusSubtasks: true })
    }
  }

  const handleSubtaskStatusChange = async (subtaskId: string, newStatus: string) => {
    try {
      await fetch("/api/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId, newStatus }),
      })
      refreshData()
    } catch (err) {
      console.error("Error updating subtask status:", err)
    }
  }

  const handleSubtaskAssigneeChange = async (subtaskId: string, assigneeId: string | null) => {
    try {
      await fetch("/api/subtasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subtaskId, assigneeId }),
      })
      refreshData()
    } catch (err) {
      console.error("Error updating subtask assignee:", err)
    }
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
    <div className="min-h-screen bg-[var(--br-bg)] flex flex-col">
      <Header
        currentUser={currentUser}
        notifications={notifications}
        onLogout={onLogout}
        onToggleTeam={() => setShowTeamModal(!showTeamModal)}
        onToggleNotifications={() => setShowNotifications(!showNotifications)}
        onEditProfile={() => setShowProfileEdit(true)}
        onToggleGitPowerUp={() => setShowGitPowerUp(true)}
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
          onAvatarUpdated={onAvatarUpdated}
        />
      )}

      {showGitPowerUp && (
        <GitPowerUpModal
          onClose={() => setShowGitPowerUp(false)}
          onChanged={refreshData}
        />
      )}

      {coverTask && (
        <CoverPickerModal
          task={coverTask}
          onClose={() => setCoverTask(null)}
          onCoverUpdated={(url) => {
            onUpdateTask(coverTask.id, { coverImageUrl: url })
          }}
        />
      )}

      {editingTask && (
        <TaskEditModal
          task={editingTask.task}
          team={team}
          currentUser={currentUser}
          workspaceLabels={workspaceLabels}
          focusSubtasks={!!editingTask.focusSubtasks}
          focusSubtaskId={editingTask.focusSubtaskId}
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
        <div className="fixed inset-0 bg-[var(--br-overlay)] z-50 flex items-center justify-center p-4">
          <div className="border-2 border-[var(--br-danger)] bg-[var(--br-bg)] max-w-lg w-full p-6">
            <div className="text-[var(--br-danger)] font-bold text-sm mb-4">{">"} SUBTAREFAS_PENDENTES</div>
            <div className="text-[var(--br-text)]/70 text-xs mb-6">
              Esta tarefa possui subtarefas que ainda não foram concluídas (APROVADO/FEITO). Deseja movê-la para FEITO mesmo assim?
            </div>
            <div className="flex gap-3">
              <button onClick={async () => {
                const pt = pendingCloseTask
                setPendingCloseTask(null)
                onMoveTask(pt.taskId, pt.fromColumnId, pt.toColumnId, pt.newPosition)
              }} className="flex-1 h-10 border border-[var(--br-danger)] text-[var(--br-danger)] text-xs hover:bg-[var(--br-danger)] hover:text-black transition-colors">
                [ FORCAR_MOVER ]
              </button>
              <button onClick={() => setPendingCloseTask(null)} className="flex-1 h-10 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors">[ CANCELAR ]</button>
            </div>
          </div>
        </div>
      )}

      {pendingSubtasksTask && (
        <div className="fixed inset-0 bg-[var(--br-overlay)] z-50 flex items-center justify-center p-4">
          <div className="border-2 border-[var(--br-danger)] bg-[var(--br-bg)] max-w-lg w-full p-6">
            <div className="text-[var(--br-danger)] font-bold text-sm mb-4">{">"} SUBTAREFAS_PENDENTES</div>
            <div className="text-[var(--br-text)]/70 text-xs mb-6">
              Esta tarefa não pode ser concluída porque possui subtarefas pendentes. Encerre ou reatribua as subtarefas antes de prosseguir.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPendingSubtasksTask(null)} className="flex-1 h-10 border border-[var(--br-danger)] text-[var(--br-danger)] text-xs hover:bg-[var(--br-danger)] hover:text-black transition-colors">
                [ ENTENDI ]
              </button>
              <button onClick={handleViewSubtasks} className="flex-1 h-10 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors">
                [ VER_SUBTAREFAS ]
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelModalTask && (
        <div className="fixed inset-0 bg-[var(--br-overlay)] z-50 flex items-center justify-center p-4">
          <div className="border-2 border-[var(--br-danger)] bg-[var(--br-bg)] max-w-lg w-full p-6">
            <div className="text-[var(--br-danger)] font-bold text-sm mb-4">{">"} CANCELAR_TAREFA</div>
            <div className="text-[var(--br-text)]/70 text-xs mb-4">Justificativa para cancelamento de "{cancelModalTask.title}":</div>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              rows={4} placeholder="MOTIVO_DO_CANCELAMENTO..."
              className="w-full px-3 py-2 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-text)] text-sm placeholder:text-[var(--br-danger)]/30 focus:border-[var(--br-danger)] focus:outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={async () => {
                if (!cancelModalTask || !cancelReason.trim()) { showToast("Informe o motivo do cancelamento.", "warning"); return }
                onUpdateTask(cancelModalTask.id, { description: `${cancelModalTask.description}\n[CANCELADO: ${cancelReason.trim()}]` })
                setCancelModalTask(null)
                setCancelReason("")
                showToast("Tarefa cancelada.", "warning")
              }} className="flex-1 h-10 border border-[var(--br-danger)] text-[var(--br-danger)] text-xs hover:bg-[var(--br-danger)] hover:text-black transition-colors">[ CONFIRMAR_CANCELAMENTO ]</button>
              <button onClick={() => { setCancelModalTask(null); setCancelReason("") }} className="flex-1 h-10 border border-[var(--br-accent)] text-[var(--br-accent)] text-xs hover:bg-[var(--br-accent)] hover:text-black transition-colors">[ VOLTAR ]</button>
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
          <div className="text-[var(--br-accent)] text-sm whitespace-nowrap">{">"} BOARD_STATUS: SUPABASE_CONNECTED</div>
          <div className="text-[var(--br-accent)]/50 text-xs whitespace-nowrap">COLUMNS: {columns.length} | TASKS: {columns.reduce((acc, col) => acc + col.tasks.length, 0)}</div>
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="h-8 px-3 border border-[var(--br-accent-strong)] bg-[var(--br-accent-strong)] text-black text-[10px] font-bold hover:bg-[var(--br-accent-strong)] transition-colors flex items-center gap-1 shadow-[0_0_8px_rgba(0,255,136,0.25)]"
          >
            + NOVA TAREFA
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`w-8 h-8 flex items-center justify-center rounded text-xs transition-colors ${
                viewMode === "kanban"
                  ? "border border-[var(--br-accent-strong)] bg-[rgba(0,255,136,0.08)] text-[var(--br-accent-strong)]"
                  : "border border-[var(--br-border)] text-[var(--br-text-secondary)] hover:border-[var(--br-border-strong)]"
              }`}
              title="Kanban"
            >⊞</button>
            <button
              onClick={() => setViewMode("list")}
              className={`w-8 h-8 flex items-center justify-center rounded text-xs transition-colors ${
                viewMode === "list"
                  ? "border border-[var(--br-accent-strong)] bg-[rgba(0,255,136,0.08)] text-[var(--br-accent-strong)]"
                  : "border border-[var(--br-border)] text-[var(--br-text-secondary)] hover:border-[var(--br-border-strong)]"
              }`}
              title="Lista"
            >☰</button>
          </div>
          <div className="relative">
            <input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="buscar..."
              className="h-8 w-28 bg-[var(--br-bg-secondary)] border border-[var(--br-border)] rounded px-2 text-[10px] text-[var(--br-text)] placeholder:text-[var(--br-text-secondary)] focus:border-[var(--br-accent)] focus:outline-none focus:w-36 transition-all"
            />
            {filterSearch && (
              <button
                onClick={() => setFilterSearch("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--br-text-secondary)] hover:text-[var(--br-text)] text-[10px]"
              >×</button>
            )}
          </div>

          <select
            value={filterAssignee[0] || ""}
            onChange={(e) => {
              const val = e.target.value
              setFilterAssignee(val ? [val] : [])
            }}
            className="h-8 max-w-[110px] bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-accent)] text-[10px] focus:border-[var(--br-accent)] focus:outline-none"
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
            className="h-8 max-w-[110px] bg-[var(--br-bg-secondary)] border border-[var(--br-border)] text-[var(--br-accent)] text-[10px] focus:border-[var(--br-accent)] focus:outline-none"
          >
            <option value="">Label</option>
            {allLabels.map((l) => (
              <option key={l.id} value={l.id}>
                {filterLabel.includes(l.id) ? "✓ " : ""}{l.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilterMine(!filterMine)}
            className={`h-8 px-2 text-[10px] transition-colors ${
              filterMine
                ? "bg-[var(--br-accent)] text-black font-bold border border-[var(--br-accent)]"
                : "bg-[var(--br-bg-secondary)] text-[var(--br-text-secondary)] border border-[var(--br-border)] hover:border-[var(--br-accent)]"
            }`}
          >
            Minhas tarefas
          </button>

          <div className="flex gap-0">
            {(["all", "active", "complete"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`h-8 px-2 text-[10px] transition-colors first:rounded-l last:rounded-r ${
                  filterStatus === s
                    ? "bg-[var(--br-accent)] text-black font-bold border border-[var(--br-accent)]"
                    : "bg-[var(--br-bg-secondary)] text-[var(--br-text-secondary)] border border-[var(--br-border)] hover:border-[var(--br-border-strong)]"
                }`}
              >
                {s === "all" ? "Todas" : s === "active" ? "Ativas" : "Feitas"}
              </button>
            ))}
          </div>

          {(filterAssignee.length > 0 || filterLabel.length > 0 || filterSearch || filterStatus !== "all" || filterMine) && (
            <button
              onClick={() => { setFilterAssignee([]); setFilterLabel([]); setFilterSearch(""); setFilterStatus("all"); setFilterMine(false) }}
              className="h-8 px-2 border border-[var(--br-danger)]/50 text-[var(--br-danger)] text-[10px] hover:border-[var(--br-danger)] transition-colors"
            >LIMPAR</button>
          )}
          <button
            onClick={() => setShowSubtasks(!showSubtasks)}
            title="Mostrar subtarefas como cards no board"
            className={`h-8 px-2 border text-[10px] transition-colors ${
              showSubtasks
                ? "border-[var(--br-accent)] bg-[var(--br-accent)] text-black font-bold"
                : "border-[var(--br-border)] bg-[var(--br-bg-secondary)] text-[var(--br-text-secondary)] hover:border-[var(--br-border-strong)] hover:text-[var(--br-text)]"
            }`}
          >
            {showSubtasks ? "✓ " : ""}MOSTRAR_SUBTAREFAS
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className="h-8 px-2 border border-[var(--br-border)] text-[var(--br-text-secondary)] text-[10px] hover:border-[var(--br-border-strong)] hover:text-[var(--br-text)] transition-colors flex items-center gap-1"
          >
            🗄 arquivados
          </button>
        </div>

        <LabelEditor
          labels={workspaceLabels}
          onManage={openLabelManager}
          onAdd={() => openLabelManager()}
        />

        {showLabelManager && (
          <LabelManagerModal
            labels={workspaceLabels}
            initialLabelId={labelManagerInitial}
            onClose={() => setShowLabelManager(false)}
            onChanged={refreshData}
          />
        )}

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
            <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-2 items-start h-[calc(100vh-200px)] md:h-[calc(100vh-180px)] scroll-smooth">
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
                  onToggleComplete={handleToggleComplete}
                  showSubtasks={showSubtasks}
                  onSubtaskStatusChange={handleSubtaskStatusChange}
                  onSubtaskAssigneeChange={handleSubtaskAssigneeChange}
                  onCoverClick={setCoverTask}
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
                className="flex-shrink-0 min-w-[280px] w-[280px] md:w-[300px] lg:w-[320px] h-16 rounded-md border border-dashed border-[var(--br-border)] text-[var(--br-accent)]/50 text-xs hover:border-[var(--br-accent)] hover:text-[var(--br-accent)] transition-colors flex items-center justify-center"
              >
                [ + NEW COLUMN ]
              </button>
            )}
          </div>
          <DragOverlay dropAnimation={{ duration: 150, easing: "ease-out" }}>
            {activeTask ? (
              <div className="w-72 bg-[var(--br-bg-secondary)] border-2 border-[var(--br-accent-strong)] rounded p-2.5 shadow-2xl opacity-95 rotate-1 scale-105 font-mono">
                <p className="text-xs text-[var(--br-text)] font-bold">{activeTask.task.title}</p>
                <p className="text-[var(--br-accent)] text-[10px] mt-1">[ DRAGGING ]</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        ) : (
          <ListView
            columns={filteredColumns}
            onEditTask={(task, colId) => setEditingTask({ task, columnId: colId })}
            onToggleComplete={handleToggleComplete}
          />
        )}
      </div>

      <footer className="border-t border-[var(--br-border)] p-3 text-center">
        <span className="text-[var(--br-accent)]/30 text-xs">
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
  const [workspaceLabels, setWorkspaceLabels] = useState<Label[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState("INITIALIZING_SYSTEM...")
  const [deepLink, setDeepLink] = useState<{ taskId: string; subtaskId?: string } | null>(null)

  // Deep link: /?task=<taskId>&subtask=<subtaskId>
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const taskId = params.get("task")
      if (!taskId) return
      const subtaskId = params.get("subtask")
      setDeepLink(subtaskId ? { taskId, subtaskId } : { taskId })
    } catch {
      // ignorar
    }
  }, [])

  // Fetch all data from API
  const fetchData = useCallback(async () => {
    try {
      const [columnsRes, tasksRes, usersRes, labelsRes] = await Promise.all([
        fetchWithRefresh("/api/columns"),
        fetchWithRefresh("/api/tasks"),
        fetchWithRefresh("/api/users"),
        fetchWithRefresh("/api/labels"),
      ])

      const [columnsData, tasksData, usersData, labelsData] = await Promise.all([
        columnsRes.json().catch(() => ({})),
        tasksRes.json().catch(() => ({})),
        usersRes.json().catch(() => ({})),
        labelsRes.json().catch(() => ({})),
      ])

      // Combine columns with their tasks
      const columnsList = Array.isArray(columnsData.columns) ? columnsData.columns : []
      const tasksList = Array.isArray(tasksData.tasks) ? tasksData.tasks : []
      const usersList = Array.isArray(usersData.users) ? usersData.users : []
      const labelsList = Array.isArray(labelsData.labels) ? labelsData.labels : []

      const columnsWithTasks = columnsList.map((col: { id: string; name: string; position: number }) => ({
        ...col,
        tasks: tasksList.filter((t: Task) => t.columnPosition === col.position).sort((a: Task, b: Task) => a.position - b.position),
      }))

      setColumns(columnsWithTasks)
      setTeam(usersList)
      setWorkspaceLabels(labelsList)

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

  // Subscribe to realtime changes on global labels (rename/color/delete refletem em todos os cartões)
  useEffect(() => {
    if (!currentUser) return
    const supabase = createClient()
    const sortLabels = (labels: Label[]) =>
      [...labels].sort((a, b) => a.name.localeCompare(b.name))

    const channel = supabase
      .channel("labels_workspace")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "labels" },
        (payload) => {
          const created: Label = {
            id: payload.new.id,
            name: payload.new.name,
            color: payload.new.color,
          }
          setWorkspaceLabels((prev) =>
            prev.some((l) => l.id === created.id)
              ? prev
              : sortLabels([...prev, created]),
          )
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "labels" },
        (payload) => {
          const updated: Label = {
            id: payload.new.id,
            name: payload.new.name,
            color: payload.new.color,
          }
          setWorkspaceLabels((prev) => {
            const next = prev.map((l) => (l.id === updated.id ? updated : l))
            return next.some((l) => l.id === updated.id)
              ? sortLabels(next)
              : sortLabels([...next, updated])
          })
          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              tasks: col.tasks.map((t) => ({
                ...t,
                labels: t.labels.map((l) => (l.id === updated.id ? updated : l)),
              })),
            })),
          )
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "labels" },
        (payload) => {
          const deletedId = payload.old.id
          setWorkspaceLabels((prev) => prev.filter((l) => l.id !== deletedId))
          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              tasks: col.tasks.map((t) => ({
                ...t,
                labels: t.labels.filter((l) => l.id !== deletedId),
              })),
            })),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  // Check subtask completion before allowing close
  const checkSubtaskCompletion = async (taskId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/subtasks?taskId=${taskId}`)
      const d = await res.json()
      const sts: Subtask[] = d.subtasks || []
      return sts.length === 0 || sts.every((st) => st.status === "APROVADO" || st.status === "FEITO")
    } catch { return true }
  }

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

  // Atualiza o avatar do usuário logado (upload de foto de perfil)
  const handleAvatarUpdated = useCallback((avatarUrl: string) => {
    setCurrentUser((c) => (c ? { ...c, avatarUrl } : c))
    fetchData()
  }, [fetchData])

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
        workspaceLabels={workspaceLabels}
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
        checkSubtaskCompletion={checkSubtaskCompletion}
        deepLink={deepLink}
        onAvatarUpdated={handleAvatarUpdated}
      />
      <ToastContainer />
    </>
  )
}

import { createAdminClient } from "@/lib/supabase/admin"
import { sendAssignmentEmail, sendMentionEmail, sendDueDateEmail, sendGenericEmail } from "@/lib/email"
import { sendTelegramMessage, formatAssignmentMessage, formatMentionMessage, formatDueDateMessage, formatGenericMessage } from "@/lib/telegram"

interface NotificationPayload {
  userId: string
  type: "assignment" | "mention" | "due_date" | "task_created" | "comment" | "status_change" | string
  message: string
  taskId?: string
  taskTitle?: string
  taskUrl?: string
  fromUser?: string
  commentPreview?: string
  dueDate?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

function buildTaskUrl(taskId: string): string {
  return `${APP_URL}/board/${taskId}`
}

export async function dispatchNotification(payload: NotificationPayload): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return

  try {
    const { data: user } = await supabase
      .from("team_members")
      .select("id, name, username, email, email_notifications_enabled, telegram_notifications_enabled, telegram_chat_id")
      .eq("id", payload.userId)
      .maybeSingle()

    if (!user) return

    const taskUrl = payload.taskId ? buildTaskUrl(payload.taskId) : APP_URL

    const promises: Promise<any>[] = []

    if (user.email_notifications_enabled && user.email) {
      switch (payload.type) {
        case "assignment":
          promises.push(sendAssignmentEmail(user.email, user.name, payload.taskTitle || "Tarefa", taskUrl))
          break
        case "mention":
          promises.push(sendMentionEmail(
            user.email,
            user.name,
            payload.fromUser || "Alguém",
            payload.taskTitle || "Tarefa",
            payload.commentPreview || payload.message,
            taskUrl
          ))
          break
        case "due_date":
          promises.push(sendDueDateEmail(user.email, user.name, payload.taskTitle || "Tarefa", payload.dueDate || "", taskUrl))
          break
        default:
          promises.push(sendGenericEmail(user.email, payload.message, "Notificação", payload.message, taskUrl, "VER"))
      }
    }

    if (user.telegram_notifications_enabled && user.telegram_chat_id) {
      switch (payload.type) {
        case "assignment":
          promises.push(sendTelegramMessage(user.telegram_chat_id, formatAssignmentMessage(payload.taskTitle || "Tarefa", taskUrl)))
          break
        case "mention":
          promises.push(sendTelegramMessage(user.telegram_chat_id, formatMentionMessage(
            payload.fromUser || "Alguém",
            payload.taskTitle || "Tarefa",
            payload.commentPreview || payload.message,
            taskUrl
          )))
          break
        case "due_date":
          promises.push(sendTelegramMessage(user.telegram_chat_id, formatDueDateMessage(payload.taskTitle || "Tarefa", payload.dueDate || "", taskUrl)))
          break
        default:
          promises.push(sendTelegramMessage(user.telegram_chat_id, formatGenericMessage("Notificação", payload.message, taskUrl, "VER")))
      }
    }

    await Promise.allSettled(promises)
  } catch (err) {
    console.error("[dispatchNotification] Erro:", err)
  }
}

export async function generateTelegramCode(userId: string): Promise<string | null> {
  const supabase = createAdminClient()
  if (!supabase) return null

  const code = Math.random().toString(36).substring(2, 10).toUpperCase()

  const { error } = await supabase
    .from("team_members")
    .update({ telegram_verification_code: code })
    .eq("id", userId)

  if (error) {
    console.error("[generateTelegramCode] Erro:", error)
    return null
  }

  return code
}

export async function clearTelegramCode(userId: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return

  await supabase
    .from("team_members")
    .update({ telegram_verification_code: null })
    .eq("id", userId)
}

export async function unlinkTelegram(userId: string): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false

  const { error } = await supabase
    .from("team_members")
    .update({
      telegram_chat_id: null,
      telegram_notifications_enabled: false,
      telegram_verification_code: null,
    })
    .eq("id", userId)

  return !error
}
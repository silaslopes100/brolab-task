interface TelegramConfig {
  botToken: string
  webhookUrl: string
}

let cachedConfig: TelegramConfig | null = null

export function getTelegramConfig(): TelegramConfig | null {
  if (cachedConfig) return cachedConfig

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL

  if (!botToken) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN não configurado")
    return null
  }

  cachedConfig = { botToken, webhookUrl: webhookUrl || "" }
  return cachedConfig
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const config = getTelegramConfig()
  if (!config) return false

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error("[telegram] Falha ao enviar:", data)
      return false
    }
    return true
  } catch (err) {
    console.error("[telegram] Erro de rede:", err)
    return false
  }
}

export function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export function buildTelegramStartUrl(code: string): string {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "BrolabTaskBot"
  return `https://t.me/${botUsername}?start=${code}`
}

export async function setTelegramWebhook(): Promise<boolean> {
  const config = getTelegramConfig()
  if (!config || !config.webhookUrl) {
    console.warn("[telegram] Webhook URL não configurada")
    return false
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: config.webhookUrl }),
    })
    const data = await res.json().catch(() => ({}))
    console.log("[telegram] SetWebhook:", data)
    return res.ok && data.ok === true
  } catch (err) {
    console.error("[telegram] Erro ao configurar webhook:", err)
    return false
  }
}

export function formatAssignmentMessage(taskTitle: string, taskUrl: string): string {
  return `<b>🔔 Nova Atribuição</b>\n\nVocê foi atribuído à tarefa <b>"${taskTitle}"</b>.\n\n<a href="${taskUrl}">Ver tarefa</a>`
}

export function formatMentionMessage(fromUser: string, taskTitle: string, commentPreview: string, taskUrl: string): string {
  return `<b>💬 Menção em Comentário</b>\n\n<b>${fromUser}</b> mencionou você na tarefa <b>"${taskTitle}"</b>:\n\n<blockquote>${commentPreview}</blockquote>\n\n<a href="${taskUrl}">Ver comentário</a>`
}

export function formatDueDateMessage(taskTitle: string, dueDate: string, taskUrl: string): string {
  return `<b>⏰ Prazo Próximo</b>\n\nA tarefa <b>"${taskTitle}"</b> tem prazo para <b>${dueDate}</b>.\n\n<a href="${taskUrl}">Ver tarefa</a>`
}

export function formatGenericMessage(title: string, message: string, actionUrl?: string, actionText?: string): string {
  let text = `<b>${title}</b>\n\n${message}`
  if (actionUrl && actionText) {
    text += `\n\n<a href="${actionUrl}">${actionText}</a>`
  }
  return text
}
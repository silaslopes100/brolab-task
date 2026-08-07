const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || "BRO.LAB <noreply@brolab.local>"
const RESEND_API_URL = "https://api.resend.com/emails"

interface EmailData {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendNotificationEmail(data: EmailData): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY não configurado — e-mails não serão enviados")
    return false
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [data.to],
        subject: data.subject,
        html: data.html,
        text: data.text,
      }),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      console.error("[email] Falha ao enviar (Resend):", error)
      return false
    }

    return true
  } catch (err) {
    console.error("[email] Erro de rede:", err)
    return false
  }
}

function buildTemplate(title: string, message: string, actionUrl?: string, actionText?: string): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0f172a; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: #22d3ee; margin: 0; font-size: 20px;">BRO.LAB</h1>
  </div>
  <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1f2937; margin-top: 0; font-size: 18px;">${title}</h2>
    <p style="color: #4b5563; margin: 16px 0;">${message}</p>
    ${actionUrl && actionText ? `
    <p style="margin: 24px 0;">
      <a href="${actionUrl}" style="background: #22d3ee; color: #0f172a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
        ${actionText}
      </a>
    </p>
    ` : ""}
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      Esta é uma notificação automática do BRO.LAB. Para alterar suas preferências, acesse as configurações do perfil.
    </p>
  </div>
</body>
</html>
  `.trim()

  const text = `
BRO.LAB
${title}
${message}
${actionUrl && actionText ? `\n${actionText}: ${actionUrl}` : ""}

---
Esta é uma notificação automática do BRO.LAB.
  `.trim()

  return { html, text }
}

export async function sendAssignmentEmail(
  to: string,
  userName: string,
  taskTitle: string,
  taskUrl: string
): Promise<boolean> {
  return sendNotificationEmail({
    to,
    subject: `[BRO.LAB] Você foi atribuído à tarefa: ${taskTitle}`,
    ...buildTemplate(
      "Nova Atribuição",
      `Olá ${userName},<br><br>Você foi atribuído à tarefa <strong>"${taskTitle}"</strong>.`,
      taskUrl,
      "VER TAREFA"
    ),
  })
}

export async function sendMentionEmail(
  to: string,
  userName: string,
  fromUser: string,
  taskTitle: string,
  commentPreview: string,
  taskUrl: string
): Promise<boolean> {
  return sendNotificationEmail({
    to,
    subject: `[BRO.LAB] ${fromUser} mencionou você em: ${taskTitle}`,
    ...buildTemplate(
      "Menção em Comentário",
      `Olá ${userName},<br><br><strong>${fromUser}</strong> mencionou você na tarefa <strong>"${taskTitle}"</strong>:<br><br><blockquote style="border-left: 3px solid #22d3ee; padding-left: 12px; color: #4b5563; margin: 12px 0;">${commentPreview}</blockquote>`,
      taskUrl,
      "VER COMENTÁRIO"
    ),
  })
}

export async function sendDueDateEmail(
  to: string,
  userName: string,
  taskTitle: string,
  dueDate: string,
  taskUrl: string
): Promise<boolean> {
  return sendNotificationEmail({
    to,
    subject: `[BRO.LAB] Prazo próximo: ${taskTitle}`,
    ...buildTemplate(
      "Prazo Próximo",
      `Olá ${userName},<br><br>A tarefa <strong>"${taskTitle}"</strong> tem prazo para <strong>${dueDate}</strong>.`,
      taskUrl,
      "VER TAREFA"
    ),
  })
}

export async function sendGenericEmail(
  to: string,
  subject: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): Promise<boolean> {
  return sendNotificationEmail({
    to,
    subject: `[BRO.LAB] ${subject}`,
    ...buildTemplate(title, message, actionUrl, actionText),
  })
}
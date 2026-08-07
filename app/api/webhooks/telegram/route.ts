import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getTelegramConfig } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  const config = getTelegramConfig()
  if (!config) {
    return NextResponse.json({ error: "Bot não configurado" }, { status: 500 })
  }

  try {
    const update = await request.json()

    const message = update.message || update.edited_message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = String(message.chat.id)
    const text = message.text || ""

    if (text.startsWith("/start")) {
      const parts = text.split(/\s+/)
      if (parts.length >= 2) {
        const code = parts[1].toUpperCase()
        const supabase = createAdminClient()
        if (supabase) {
          const { data: user, error } = await supabase
            .from("team_members")
            .select("id, name, username")
            .eq("telegram_verification_code", code)
            .maybeSingle()

          if (!error && user) {
            await supabase
              .from("team_members")
              .update({
                telegram_chat_id: chatId,
                telegram_verification_code: null,
                telegram_notifications_enabled: true,
              })
              .eq("id", user.id)

            await sendTelegramMessage(chatId, `✅ <b>Conta vinculada!</b>\n\nOlá ${user.name} (@${user.username}), suas notificações do BRO.LAB estão agora conectadas ao Telegram.`)
          } else {
            await sendTelegramMessage(chatId, "❌ Código inválido ou expirado. Gere um novo código nas configurações do seu perfil no BRO.LAB.")
          }
        }
      } else {
        await sendTelegramMessage(chatId, "🤖 <b>BRO.LAB Bot</b>\n\nPara vincular sua conta, acesse as configurações do seu perfil no BRO.LAB, gere um código de verificação e use:\n<code>/start SEU_CODIGO</code>")
      }
    } else if (text === "/help" || text === "/ajuda") {
      await sendTelegramMessage(chatId, "🤖 <b>BRO.LAB Bot - Comandos</b>\n\n/start <código> — Vincular conta\n/help — Esta ajuda\n\nVocê receberá notificações automáticas quando:\n• For atribuído a uma tarefa\n• For mencionado em comentários\n• Uma tarefa tiver prazo próximo")
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[telegram webhook] Erro:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${getTelegramConfig()?.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    })
  } catch {
    // silencioso
  }
}
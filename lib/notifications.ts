import { createAdminClient } from "@/lib/supabase/admin"

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
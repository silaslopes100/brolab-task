import "server-only"
import webpush from "web-push"
import type { ActivityClient } from "@/lib/activities"

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || ""
const VAPID_CONTACT = process.env.VAPID_CONTACT_EMAIL || "brolabs01@gmail.com"

let initialized = false

function ensureVapid(): boolean {
  if (initialized) return true
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false
  webpush.setVapidDetails(`mailto:${VAPID_CONTACT}`, VAPID_PUBLIC, VAPID_PRIVATE)
  initialized = true
  return true
}

export interface PushPayload {
  title?: string
  body: string
  url?: string
  tag?: string
}

export function vapidPublicKey(): string {
  return VAPID_PUBLIC
}

// Envia push para todas as inscrições do usuário.
// Nunca lança: notificações push não podem travar o fluxo principal.
// Inscrições inválidas/expiradas (404/410) são removidas automaticamente.
export async function sendPushToUser(
  supabase: ActivityClient,
  userId: string,
  payload: PushPayload,
): Promise<void> {
  if (!ensureVapid()) return

  try {
    const { data: subs, error } = await (supabase as any)
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId)
      .eq("push_notifications_enabled", true)

    if (error || !subs || subs.length === 0) return

    const message = JSON.stringify({
      title: payload.title || "BROLABTASK",
      body: payload.body,
      url: payload.url || "/",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag || "brolabtask",
    })

    const sendOne = async (sub: { endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message,
        )
      } catch (err: any) {
        if (err && (err.statusCode === 404 || err.statusCode === 410)) {
          await (supabase as any).from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
        } else {
          console.error("[push] Falha ao enviar:", err)
        }
      }
    }

    await Promise.allSettled(subs.map(sendOne))
  } catch (err) {
    console.error("[sendPushToUser] Erro:", err)
  }
}
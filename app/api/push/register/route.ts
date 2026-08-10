import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getRequestUserId } from "@/lib/activities"

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
      { status: 500 },
    )
  }

  const userId = getRequestUserId(request)
  if (!userId) {
    return NextResponse.json({ error: "ERRO: NAO_AUTENTICADO" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const endpoint = body?.endpoint
  const p256dh = body?.keys?.p256dh
  const auth = body?.keys?.auth

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "ERRO: INSCRICAO_INVALIDA" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("endpoint", endpoint)
    .maybeSingle()

  if (existing) {
    await supabase
      .from("push_subscriptions")
      .update({ user_id: userId, p256dh, auth, user_agent: request.headers.get("user-agent") || null })
      .eq("id", existing.id)
  } else {
    await supabase.from("push_subscriptions").insert({
      user_id: userId,
      endpoint,
      p256dh,
      auth,
      user_agent: request.headers.get("user-agent") || null,
    })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
      { status: 500 },
    )
  }

  const userId = getRequestUserId(request)
  if (!userId) {
    return NextResponse.json({ error: "ERRO: NAO_AUTENTICADO" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.endpoint) {
    return NextResponse.json({ error: "ERRO: ENDPOINT_OBRIGATORIO" }, { status: 400 })
  }

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint)
    .eq("user_id", userId)

  return NextResponse.json({ ok: true })
}
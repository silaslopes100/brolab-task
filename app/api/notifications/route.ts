import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ notifications: [] })
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
      { status: 500 },
    )
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_BUSCAR_NOTIFICACOES" },
      { status: 500 },
    )
  }

  const notifications = (data ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    taskId: n.task_id,
    boardId: n.board_id,
    subtaskId: n.subtask_id,
    taskTitle: n.task_title,
    fromUser: n.from_user,
    createdAt: n.created_at,
    read: n.read,
  }))

  return NextResponse.json({ notifications })
}

export async function PATCH(request: Request) {
  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
      { status: 500 },
    )
  }

  const { id, isRead } = await request.json()
  if (!id) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
  }

  const { error } = await supabase.from("notifications").update({ read: isRead }).eq("id", id)
  if (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
      { status: 500 },
    )
  }

  if (!userId) {
    return NextResponse.json({ success: false, error: "userId obrigatório" }, { status: 400 })
  }

  const { error } = await supabase.from("notifications").delete().eq("user_id", userId)
  if (error) {
    console.error("Error clearing notifications:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

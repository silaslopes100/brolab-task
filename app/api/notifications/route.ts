import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select(`
        *,
        from_user:users!notifications_from_user_id_fkey (id, name, username),
        task:tasks (id, title)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      type: "mention" as const,
      message: n.message,
      taskId: n.task_id,
      taskTitle: n.task?.title || "Unknown",
      fromUser: n.from_user?.name || "Unknown",
      createdAt: n.created_at,
      read: n.is_read,
    }))

    return NextResponse.json({ notifications: formattedNotifications })
  } catch (err) {
    console.error("Error fetching notifications:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_BUSCAR_NOTIFICAÇÕES" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, isRead } = await request.json()
    const supabase = await createClient()

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: isRead })
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "ERRO: FALHA_AO_ATUALIZAR_NOTIFICAÇÃO" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "ERRO: FALHA_AO_DELETAR_NOTIFICAÇÕES" }, { status: 500 })
  }
}

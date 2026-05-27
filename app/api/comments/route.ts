import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { taskId, userId, content, mentions } = await request.json()
    const supabase = await createClient()

    // Criar comentário
    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        task_id: taskId,
        user_id: userId,
        content,
      })
      .select(`
        *,
        users (id, name, username)
      `)
      .single()

    if (error) throw error

    // Criar notificações para menções
    if (mentions && mentions.length > 0) {
      const { data: mentionedUsers } = await supabase
        .from("users")
        .select("id, username")
        .in("username", mentions)

      if (mentionedUsers && mentionedUsers.length > 0) {
        // Buscar informações da tarefa
        const { data: task } = await supabase
          .from("tasks")
          .select("title")
          .eq("id", taskId)
          .single()

        const notifications = mentionedUsers
          .filter((u) => u.id !== userId)
          .map((u) => ({
            user_id: u.id,
            from_user_id: userId,
            task_id: taskId,
            message: `Você foi mencionado na tarefa "${task?.title || "Unknown"}"`,
            is_read: false,
          }))

        if (notifications.length > 0) {
          await supabase.from("notifications").insert(notifications)
        }
      }
    }

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        authorId: comment.user_id,
        authorName: comment.users?.name || "Unknown",
        mentions: mentions || [],
      },
    })
  } catch (err) {
    console.error("Error creating comment:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_CRIAR_COMENTÁRIO" }, { status: 500 })
  }
}

import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { taskId, authorUsername, content } = await request.json()
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const { data: comment, error } = await supabase
      .from("task_comments")
      .insert({
        task_id: taskId,
        author_username: authorUsername,
        content,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        authorId: comment.author_username,
        authorName: comment.author_username,
        mentions: [],
      },
    })
  } catch (err) {
    console.error("Error creating comment:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_CRIAR_COMENTÁRIO" },
      { status: 500 },
    )
  }
}

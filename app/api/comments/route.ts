import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import { CreateCommentSchema, validate } from "@/lib/validation"
import { DEFAULT_WORKSPACE_ID } from "@/lib/labels"
import { logActivity, resolveUserIdByUsername } from "@/lib/activities"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = validate(CreateCommentSchema, body)
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const { taskId, subtaskId, authorUsername, content } = parsed.data!
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const mentions = (content.match(/@[\w.à-úÀ-Ú]+/g) || [])
    if (mentions.length > 0) {
      const { data: mentionedUsers, error: usersError } = await supabase
        .from('team_members')
        .select('id, username')
        .in('username', mentions)

      if (!usersError && mentionedUsers && mentionedUsers.length > 0) {
        const refTable = subtaskId ? 'subtasks' : 'tasks'
        const { data: refData, error: refError } = await supabase
          .from(refTable)
          .select('title')
          .eq('id', subtaskId || taskId)
          .single()
        const refTitle = refData?.title || ''
        const notifInserts = mentionedUsers.map((u) => ({
          user_id: u.id,
          type: 'mention',
          message: `${authorUsername} mencionou você em "${refTitle}"`,
          task_id: taskId,
          board_id: DEFAULT_WORKSPACE_ID,
          subtask_id: subtaskId || undefined,
          task_title: refTitle,
          from_user: authorUsername,
          read: false,
        }))
        await supabase.from('notifications').insert(notifInserts)
      }
    }

    const insertData: Record<string, unknown> = {
      task_id: taskId,
      author_username: authorUsername,
      content,
    }
    if (subtaskId) insertData.subtask_id = subtaskId

    const { data: comment, error } = await supabase
      .from("task_comments")
      .insert(insertData)
      .select()
      .single()
    if (error) throw error

    // Histórico de atividades: comentário adicionado
    let activityTaskId = taskId
    if (!activityTaskId && subtaskId) {
      const { data: st } = await supabase
        .from("subtasks")
        .select("task_id")
        .eq("id", subtaskId)
        .single()
      activityTaskId = st?.task_id || null
    }
    if (activityTaskId) {
      const authorId = await resolveUserIdByUsername(supabase, authorUsername)
      await logActivity(supabase, {
        taskId: activityTaskId,
        userId: authorId,
        action: "comment",
        newValue: { content: comment.content, subtaskId: subtaskId || null },
      })
    }

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        authorId: comment.author_username,
        authorName: comment.author_username,
        subtaskId: comment.subtask_id || null,
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

export async function PATCH(request: NextRequest) {
  try {
    const { id, content } = await request.json()
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    if (!id || !content) {
      return NextResponse.json(
        { error: "ERRO: ID_E_CONTEUDO_OBRIGATORIOS" },
        { status: 400 },
      )
    }

    const { data: comment, error } = await supabase
      .from("task_comments")
      .update({ content })
      .eq("id", id)
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
        subtaskId: comment.subtask_id || null,
      },
    })
  } catch (err) {
    console.error("Error updating comment:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_ATUALIZAR_COMENTÁRIO" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const { error } = await supabase.from("task_comments").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting comment:", err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

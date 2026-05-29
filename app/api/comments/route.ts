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

    const mentions = (content.match(/@([\w]+)/g) || []).map((m) => m.slice(1))
    // Insert notifications for each mentioned user
    if (mentions.length > 0) {
      // Fetch user IDs for mentioned usernames
      const { data: mentionedUsers, error: usersError } = await supabase
        .from('team_members')
        .select('id, username')
        .in('username', mentions)

      if (!usersError && mentionedUsers && mentionedUsers.length > 0) {
        // Get task title for notification message
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('title')
          .eq('id', taskId)
          .single()
        const taskTitle = taskData?.title || ''
        const notifInserts = mentionedUsers.map((u) => ({
          user_id: u.id,
          type: 'mention',
          message: `${authorUsername} mencionou você na tarefa "${taskTitle}"`,
          task_id: taskId,
          task_title: taskTitle,
          from_user: authorUsername,
          read: false,
        }))
        await supabase.from('notifications').insert(notifInserts)
      }
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

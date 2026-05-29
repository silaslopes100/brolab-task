import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const BUCKET_NAME = "task-files"

const LABEL_COLORS = [
  "#FFFFFF",
  "#6B7280",
  "#84CC16",
  "#A3E635",
  "#F97316",
  "#EF4444",
  "#22C55E",
]

function getLabelColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length]
}

export async function GET() {
  try {
    const supabase = createAdminClient() ?? (await createClient())

    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .order("position", { ascending: true })

    if (error) throw error

    const { data: comments, error: commentsError } = await supabase
      .from("task_comments")
      .select("*")
      .order("created_at", { ascending: true })

    if (commentsError) throw commentsError

    const commentsByTaskId: Record<string, typeof comments> = {}
    if (comments) {
      for (const c of comments) {
        if (!commentsByTaskId[c.task_id]) commentsByTaskId[c.task_id] = []
        commentsByTaskId[c.task_id].push(c)
      }
    }

    const { data: taskFiles, error: filesError } = await supabase
      .from("task_files")
      .select("*")
      .order("created_at", { ascending: true })

    if (filesError) throw filesError

    const filesByTaskId: Record<string, typeof taskFiles> = {}
    if (taskFiles) {
      for (const f of taskFiles) {
        if (!filesByTaskId[f.task_id]) filesByTaskId[f.task_id] = []
        filesByTaskId[f.task_id].push(f)
      }
    }

    const formattedTasks = (tasks || []).map((task) => {
      const files = (filesByTaskId[task.id] || []).map((f) => {
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(f.path)
        return {
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          url: urlData?.publicUrl || "",
          createdAt: f.created_at,
        }
      })
      return {
        id: task.id,
        title: task.title,
        description: task.description || "",
        columnId: task.status,
        position: task.position,
        createdAt: task.created_at,
        assignees: task.assignees || [],
        labels: (task.labels || []).map((name: string) => ({
          id: name,
          name,
          color: getLabelColor(name),
        })),
        comments: (commentsByTaskId[task.id] || []).map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.created_at,
          authorId: c.author_username,
          authorName: c.author_username,
          mentions: [],
        })),
        files,
      }
    })

    return NextResponse.json({ tasks: formattedTasks })
  } catch (err) {
    console.error("Error fetching tasks:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_BUSCAR_TAREFAS" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, columnId, position, assignees, labels } =
      await request.json()
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        title,
        description: description || "",
        status: columnId || "BACKLOG",
        position: position || 0,
        assignees: assignees || [],
        labels: labels
          ? labels.map((l: { name: string }) => l.name)
          : [],
      })
      .select()
      .single()

    if (taskError) throw taskError

    return NextResponse.json({
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        columnId: task.status,
        position: task.position,
        createdAt: task.created_at,
        assignees: task.assignees || [],
        labels: (task.labels || []).map((name: string) => ({
          id: name,
          name,
          color: getLabelColor(name),
        })),
        comments: [],
        files: [],
      },
    })
  } catch (err) {
    console.error("Error creating task:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_CRIAR_TAREFA" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, title, description, columnId, position, assignees, labels } =
      await request.json()
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (columnId !== undefined) updates.status = columnId
    if (position !== undefined) updates.position = position
    if (assignees !== undefined) updates.assignees = assignees
    if (labels !== undefined)
      updates.labels = labels.map((l: { name: string }) => l.name)

    if (Object.keys(updates).length > 0) {
      const { error: taskError } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)

      if (taskError) throw taskError
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error updating task:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_ATUALIZAR_TAREFA" },
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
    const { error } = await supabase.from("tasks").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_DELETAR_TAREFA" },
      { status: 500 },
    )
  }
}

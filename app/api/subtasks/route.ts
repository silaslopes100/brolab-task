import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { CreateSubtaskSchema, validate } from "@/lib/validation"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json(
        { error: "ERRO: TASK_ID_OBRIGATORIO" },
        { status: 400 },
      )
    }

    const supabase = createAdminClient() ?? (await createClient())

    const { data: subtasks, error } = await supabase
      .from("subtasks")
      .select("*")
      .eq("task_id", taskId)
      .order("position", { ascending: true })

    if (error) throw error

    const subtaskIds = (subtasks || []).map((s) => s.id)
    let commentsBySubtaskId: Record<string, unknown[]> = {}
    let filesBySubtaskId: Record<string, unknown[]> = {}

    if (subtaskIds.length > 0) {
      const [{ data: comments }, { data: files }] = await Promise.all([
        supabase
          .from("task_comments")
          .select("*")
          .in("subtask_id", subtaskIds)
          .order("created_at", { ascending: true }),
        supabase
          .from("task_files")
          .select("*")
          .in("subtask_id", subtaskIds)
          .order("created_at", { ascending: true }),
      ])

      if (comments) {
        for (const c of comments) {
          if (!commentsBySubtaskId[c.subtask_id]) commentsBySubtaskId[c.subtask_id] = []
          commentsBySubtaskId[c.subtask_id].push(c)
        }
      }
      if (files) {
        for (const f of files) {
          if (!filesBySubtaskId[f.subtask_id]) filesBySubtaskId[f.subtask_id] = []
          filesBySubtaskId[f.subtask_id].push(f)
        }
      }
    }

    const formatted = (subtasks || []).map((s) => {
      const now = Date.now()
      const timerStartedAt = s.timer_started_at ? new Date(s.timer_started_at).getTime() : null
      const currentTimeSpent = s.time_spent || 0
      const liveTimeSpent = timerStartedAt
        ? currentTimeSpent + (now - timerStartedAt) / 1000
        : currentTimeSpent

      return {
        id: s.id,
        taskId: s.task_id,
        title: s.title,
        description: s.description || "",
        estimatedHours: s.estimated_hours || 0,
        timeSpent: Math.round(liveTimeSpent),
        status: s.status,
        position: s.position,
        assignees: s.assignees || [],
        timerStartedAt: s.timer_started_at,
        comments: (commentsBySubtaskId[s.id] || []).map((c: Record<string, unknown>) => ({
          id: c.id,
          content: c.content,
          createdAt: c.created_at,
          authorId: c.author_username,
          authorName: c.author_username,
          subtaskId: s.id,
        })),
        files: (filesBySubtaskId[s.id] || []).map((f: Record<string, unknown>) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          url: supabase.storage.from('task-files').getPublicUrl(f.path as string).data?.publicUrl || '',
          createdAt: f.created_at,
        })),
        createdAt: s.created_at,
      }
    })

    return NextResponse.json({ subtasks: formatted })
  } catch (err) {
    console.error("Error fetching subtasks:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_BUSCAR_SUBTAREFAS" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = validate(CreateSubtaskSchema, body)
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const { taskId, title, description, estimatedHours, position } = parsed.data!
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const { data: subtask, error } = await supabase
      .from("subtasks")
      .insert({
        task_id: taskId,
        title,
        description: description || "",
        estimated_hours: estimatedHours || 0,
        position: position || 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      subtask: {
        id: subtask.id,
        taskId: subtask.task_id,
        title: subtask.title,
        description: subtask.description,
        estimatedHours: subtask.estimated_hours || 0,
        timeSpent: 0,
        status: subtask.status,
        position: subtask.position,
        assignees: subtask.assignees || [],
        comments: [],
        createdAt: subtask.created_at,
      },
    })
  } catch (err) {
    console.error("Error creating subtask:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_CRIAR_SUBTAREFA" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, title, description, estimatedHours, status, position, assignees } =
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
    if (estimatedHours !== undefined) updates.estimated_hours = estimatedHours
    if (status !== undefined) updates.status = status
    if (position !== undefined) updates.position = position
    if (assignees !== undefined) updates.assignees = assignees

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("subtasks")
        .update(updates)
        .eq("id", id)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error updating subtask:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_ATUALIZAR_SUBTAREFA" },
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

    const { error } = await supabase.from("subtasks").delete().eq("id", id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_DELETAR_SUBTAREFA" },
      { status: 500 },
    )
  }
}

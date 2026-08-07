import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { CreateSubtaskSchema, validate } from "@/lib/validation"
import { DEFAULT_WORKSPACE_ID } from "@/lib/labels"
import { getRequestUserId, logActivity } from "@/lib/activities"

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
    let commentsBySubtaskId: Record<string, Record<string, unknown>[]> = {}
    let filesBySubtaskId: Record<string, Record<string, unknown>[]> = {}

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
        actualHours: s.actual_hours || 0,
        timeSpent: Math.round(liveTimeSpent),
        status: s.status,
        position: s.position,
        assignees: s.assignees || [],
        assigneeId: s.assignee_id || null,
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
    const { taskId, title, description, estimatedHours, actualHours, position } = parsed.data!
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
        actual_hours: actualHours || 0,
        position: position || 0,
      })
      .select()
      .single()

    if (error) throw error

    await logActivity(supabase, {
      taskId,
      userId: getRequestUserId(request),
      action: "subtask_created",
      newValue: { subtaskId: subtask.id, title: subtask.title },
    })

    return NextResponse.json({
      subtask: {
        id: subtask.id,
        taskId: subtask.task_id,
        title: subtask.title,
        description: subtask.description,
        estimatedHours: subtask.estimated_hours || 0,
        actualHours: subtask.actual_hours || 0,
        timeSpent: 0,
        status: subtask.status,
        position: subtask.position,
        assignees: subtask.assignees || [],
        assigneeId: subtask.assignee_id || null,
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
    const { id, title, description, estimatedHours, actualHours, status, position, assignees, assigneeId } =
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
    if (actualHours !== undefined) updates.actual_hours = actualHours
    if (status !== undefined) updates.status = status
    if (position !== undefined) updates.position = position
    if (assignees !== undefined) updates.assignees = assignees
    if (assigneeId !== undefined) updates.assignee_id = assigneeId

    const userId = getRequestUserId(request)

    // Snapshot para o diff do histórico de atividades
    let currentSubtask: {
      task_id: string
      title: string
      status: string
      assignee_id: string | null
    } | null = null
    if (status !== undefined || assigneeId !== undefined) {
      const { data: snapshot, error: snapshotError } = await supabase
        .from("subtasks")
        .select("task_id, title, status, assignee_id")
        .eq("id", id)
        .single()
      if (snapshotError) throw snapshotError
      currentSubtask = snapshot
    }

    let prevAssigneeId: string | null = null
    let subtaskTitle = ""
    let subtaskTaskId = ""
    if (currentSubtask) {
      prevAssigneeId = currentSubtask.assignee_id ?? null
      subtaskTitle = currentSubtask.title || ""
      subtaskTaskId = currentSubtask.task_id || ""
    } else if (assigneeId !== undefined) {
      const { data: current, error: currentError } = await supabase
        .from("subtasks")
        .select("task_id, title, assignee_id")
        .eq("id", id)
        .single()
      if (currentError) throw currentError
      prevAssigneeId = current?.assignee_id || null
      subtaskTitle = current?.title || ""
      subtaskTaskId = current?.task_id || ""
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("subtasks")
        .update(updates)
        .eq("id", id)

      if (error) throw error
    }

    // Histórico de atividades da subtarefa
    if (currentSubtask && subtaskTaskId) {
      if (status !== undefined && status !== currentSubtask.status) {
        await logActivity(supabase, {
          taskId: subtaskTaskId,
          userId,
          action: "subtask_status",
          oldValue: { subtaskId: id, title: currentSubtask.title, status: currentSubtask.status },
          newValue: { subtaskId: id, title: currentSubtask.title, status },
        })
      }
      if (assigneeId !== undefined && (assigneeId ?? null) !== (currentSubtask.assignee_id ?? null)) {
        const ids = [currentSubtask.assignee_id, assigneeId].filter(Boolean) as string[]
        const { data: members } = ids.length > 0
          ? await supabase.from("team_members").select("id, name").in("id", ids)
          : { data: null }
        const nameOf = (uid: string | null) => (members || []).find((m) => m.id === uid)?.name || null
        await logActivity(supabase, {
          taskId: subtaskTaskId,
          userId,
          action: "subtask_assignee",
          oldValue: { subtaskId: id, title: currentSubtask.title, assigneeId: currentSubtask.assignee_id, name: nameOf(currentSubtask.assignee_id) },
          newValue: { subtaskId: id, title: currentSubtask.title, assigneeId: assigneeId ?? null, name: nameOf(assigneeId ?? null) },
        })
      }
    }

    // Notifica o novo responsável pela subtarefa (apenas quando houver mudança real)
    if (assigneeId !== undefined && assigneeId !== prevAssigneeId && assigneeId) {
      const { data: assignee, error: assigneeError } = await supabase
        .from("team_members")
        .select("name")
        .eq("id", assigneeId)
        .single()
      if (!assigneeError && assignee) {
        await supabase.from("notifications").insert({
          user_id: assigneeId,
          type: "assignment",
          message: `Você foi atribuído à subtarefa: ${subtaskTitle}`,
          task_id: subtaskTaskId,
          board_id: DEFAULT_WORKSPACE_ID,
          subtask_id: id,
          task_title: subtaskTitle,
          from_user: "",
          read: false,
        })
      }
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

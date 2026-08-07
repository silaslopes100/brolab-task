import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { CreateTaskSchema, UpdateTaskSchema, validate } from "@/lib/validation"
import { DEFAULT_WORKSPACE_ID } from "@/lib/labels"
import { createTodoistTask, mapTodoistPriority } from "@/lib/todoist"
import { getRequestUserId, logActivity } from "@/lib/activities"
import { dispatchNotification } from "@/lib/notifications"

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

function parseLegacyLabel(raw: string): { id: string; name: string; color: string } {
  const [name, color] = raw.split("||")
  return { id: name, name, color: color || getLabelColor(name) }
}

function sortLabels(labels: Array<{ id: string; name: string; color: string }>) {
  return [...labels].sort((a, b) => a.name.localeCompare(b.name))
}

// Sincroniza os labels globais do cartão na tabela card_labels.
// Aceita itens com id real (UUID) ou apenas name (resolvido pelo nome global).
async function syncCardLabels(
  supabase: NonNullable<ReturnType<typeof createAdminClient>> | Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  labels: Array<{ id?: string; name: string; color?: string }>,
): Promise<void> {
  const { data: allLabels } = await supabase.from("labels").select("id, name")
  const byName = new Map<string, string>()
  for (const l of allLabels || []) {
    byName.set(String(l.name).toUpperCase(), l.id)
  }
  const labelIds = new Set<string>()
  for (const l of labels) {
    if (!l || !l.name) continue
    const id = l.id && l.id !== l.name ? l.id : byName.get(l.name.toUpperCase())
    if (id) labelIds.add(id)
  }
  await supabase.from("card_labels").delete().eq("card_id", taskId)
  if (labelIds.size > 0) {
    await supabase.from("card_labels").insert(
      [...labelIds].map((label_id) => ({ card_id: taskId, label_id })),
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient() ?? (await createClient())

    const { searchParams } = new URL(request.url)
    const pageParam = searchParams.get("page")
    const pageSizeParam = searchParams.get("pageSize")
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1
    const pageSize = pageSizeParam ? Math.min(100, Math.max(1, parseInt(pageSizeParam, 10) || 50)) : 0
    const hasPagination = pageParam !== null

    const [{ count: totalTasks }, tasksResult] = await Promise.all([
      hasPagination
        ? supabase.from("tasks").select("*", { count: "exact", head: true }).eq("is_closed", false)
        : Promise.resolve({ count: null, error: null }),
      hasPagination
        ? supabase.from("tasks").select("*").eq("is_closed", false).order("position", { ascending: true }).range((page - 1) * pageSize, page * pageSize - 1)
        : supabase.from("tasks").select("*").eq("is_closed", false).order("position", { ascending: true }),
    ])

    const { data: tasks, error: tasksError } = tasksResult
    if (tasksError) throw tasksError

    const taskIds = (tasks || []).map((t) => t.id)

    const [commentsResult, taskFilesResult, subtasksResult, labelsResult, cardLabelsResult] = taskIds.length > 0 ? await Promise.all([
      supabase.from("task_comments").select("*").in("task_id", taskIds).order("created_at", { ascending: true }),
      supabase.from("task_files").select("*").in("task_id", taskIds).order("created_at", { ascending: true }),
      supabase.from("subtasks").select("id, task_id, title, status, position, assignee_id, estimated_hours, time_spent, timer_started_at").in("task_id", taskIds),
      supabase.from("labels").select("id, name, color").order("name", { ascending: true }),
      supabase.from("card_labels").select("card_id, label_id").in("card_id", taskIds),
    ]) : [
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
    ]

    const { data: comments, error: commentsError } = commentsResult
    if (commentsError) throw commentsError

    const { data: taskFiles, error: filesError } = taskFilesResult
    if (filesError) throw filesError

    const { data: allSubtasks } = subtasksResult

    const { data: allLabels, error: labelsError } = labelsResult
    if (labelsError) throw labelsError

    const { data: cardLabels } = cardLabelsResult

    const labelById = new Map<string, { id: string; name: string; color: string }>()
    for (const l of allLabels || []) {
      labelById.set(l.id, { id: l.id, name: l.name, color: l.color })
    }

    const labelIdsByTask: Record<string, string[]> = {}
    for (const cl of cardLabels || []) {
      if (!labelIdsByTask[cl.card_id]) labelIdsByTask[cl.card_id] = []
      labelIdsByTask[cl.card_id].push(cl.label_id)
    }

    const commentsByTaskId: Record<string, any[]> = {}
    if (comments) {
      for (const c of comments) {
        if (!commentsByTaskId[c.task_id]) commentsByTaskId[c.task_id] = []
        commentsByTaskId[c.task_id].push(c)
      }
    }

    const filesByTaskId: Record<string, any[]> = {}
    if (taskFiles) {
      for (const f of taskFiles) {
        if (!filesByTaskId[f.task_id]) filesByTaskId[f.task_id] = []
        filesByTaskId[f.task_id].push(f)
      }
    }

    const subtaskAggByTaskId: Record<string, { count: number; totalEstimated: number; totalTimeSpent: number }> = {}
    const subtasksByTaskId: Record<string, Array<{ id: string; title: string; status: string; position: number; assigneeId: string | null }>> = {}
    if (allSubtasks) {
      for (const st of allSubtasks) {
        if (!subtaskAggByTaskId[st.task_id]) {
          subtaskAggByTaskId[st.task_id] = { count: 0, totalEstimated: 0, totalTimeSpent: 0 }
        }
        const agg = subtaskAggByTaskId[st.task_id]
        agg.count++
        agg.totalEstimated += st.estimated_hours || 0
        const now = Date.now()
        const startedAt = st.timer_started_at ? new Date(st.timer_started_at).getTime() : null
        const liveTime = startedAt
          ? (st.time_spent || 0) + (now - startedAt) / 1000
          : (st.time_spent || 0)
        agg.totalTimeSpent += Math.round(liveTime)

        if (!subtasksByTaskId[st.task_id]) subtasksByTaskId[st.task_id] = []
        subtasksByTaskId[st.task_id].push({
          id: st.id,
          title: st.title,
          status: st.status,
          position: st.position ?? 0,
          assigneeId: st.assignee_id ?? null,
        })
      }
      for (const key of Object.keys(subtasksByTaskId)) {
        subtasksByTaskId[key].sort((a, b) => a.position - b.position)
      }
    }

    const formattedTasks = (tasks || []).map((task) => {
      const subtaskAgg = subtaskAggByTaskId[task.id] || { count: 0, totalEstimated: 0, totalTimeSpent: 0 }
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

      const labelMap = new Map<string, { id: string; name: string; color: string }>()
      for (const labelId of labelIdsByTask[task.id] || []) {
        const label = labelById.get(labelId)
        if (label) labelMap.set(label.id, label)
      }
      // Fallback: nomes legados do array tasks.labels que não viraram labels globais
      for (const raw of task.labels || []) {
        const legacy = parseLegacyLabel(raw)
        if (!labelById.has(legacy.id)) labelMap.set(legacy.id, legacy)
      }

      return {
        id: task.id,
        title: task.title,
        description: task.description || "",
        columnPosition: task.column_position,
        position: task.position,
        isComplete: task.is_complete ?? false,
        isClosed: task.is_closed ?? false,
        createdAt: task.created_at,
        assignees: task.assignees || [],
        assigneeId: task.assignee_id ?? null,
        coverImageUrl: task.cover_image_url ?? null,
        todoistId: task.todoist_id ?? null,
        labels: sortLabels([...labelMap.values()]),
        subtaskCount: subtaskAgg.count,
        subtasks: subtasksByTaskId[task.id] || [],
        totalEstimatedHours: subtaskAgg.totalEstimated,
        totalTimeSpent: subtaskAgg.totalTimeSpent,
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

    const response: Record<string, unknown> = { tasks: formattedTasks }
    if (hasPagination) {
      response.pagination = { page, pageSize, total: totalTasks || 0, totalPages: Math.ceil((totalTasks || 0) / pageSize) }
    }
    return NextResponse.json(response)
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
    const body = await request.json()
    const parsed = validate(CreateTaskSchema, body)
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const { title, description, position, assignees, labels, assigneeId } = parsed.data!
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
        column_position: 0, // always create in BACKLOG
        position: position || 0,
        assignees: assignees || [],
        assignee_id: assigneeId ?? null,
        labels: labels
          ? labels.map((l: { name: string; color?: string }) => `${l.name}||${l.color || getLabelColor(l.name)}`)
          : [],
      })
      .select()
      .single()

    if (taskError) throw taskError

    await logActivity(supabase, {
      taskId: task.id,
      userId: getRequestUserId(request),
      action: "created",
      newValue: {
        title: task.title,
        description: task.description || "",
        assigneeId: assigneeId ?? null,
      },
    })

    // Notifica o responsável pela tarefa
    if (assigneeId) {
      const { data: assignee, error: assigneeError } = await supabase
        .from("team_members")
        .select("name")
        .eq("id", assigneeId)
        .single()
      if (!assigneeError && assignee) {
        await supabase.from("notifications").insert({
          user_id: assigneeId,
          type: "assignment",
          message: `Você foi atribuído à tarefa: ${task.title}`,
          task_id: task.id,
          board_id: DEFAULT_WORKSPACE_ID,
          task_title: task.title,
          from_user: "",
          read: false,
        })
        dispatchNotification({
          userId: assigneeId,
          type: "assignment",
          message: `Você foi atribuído à tarefa: ${task.title}`,
          taskId: task.id,
          taskTitle: task.title,
        })
      }

      // Integração Todoist: criação assíncrona, não bloqueia o fluxo principal
      void (async () => {
        try {
          const created = await createTodoistTask({
            content: task.title,
            description: task.description || "",
            priority: mapTodoistPriority(labels || []),
          })
          if (created?.id) {
            await supabase.from("tasks").update({ todoist_id: created.id }).eq("id", task.id)
          }
        } catch (err) {
          console.error("[todoist] falha na sincronização pós-criação:", err)
        }
      })()
    }

    await syncCardLabels(supabase, task.id, labels || [])

    const { data: joinedIds } = await supabase
      .from("card_labels")
      .select("label_id")
      .eq("card_id", task.id)
    const { data: joinedLabels } = joinedIds && joinedIds.length > 0
      ? await supabase
          .from("labels")
          .select("id, name, color")
          .in("id", joinedIds.map((j) => j.label_id))
      : { data: null }
    const responseLabels = sortLabels(
      (joinedLabels || []).map((l) => ({ id: l.id, name: l.name, color: l.color })),
    )

    // Notify all users about the new task
    const { data: allUsers, error: usersError } = await supabase
      .from('team_members')
      .select('id')
    if (!usersError && allUsers && allUsers.length > 0) {
      const notifInserts = allUsers.map((u) => ({
        user_id: u.id,
        type: 'task_created',
        message: `Nova tarefa criada: ${task.title}`,
        task_id: task.id,
        board_id: DEFAULT_WORKSPACE_ID,
        task_title: task.title,
        from_user: '',
        read: false,
      }))
      await supabase.from('notifications').insert(notifInserts)
      for (const u of allUsers) {
        dispatchNotification({
          userId: u.id,
          type: "task_created",
          message: `Nova tarefa criada: ${task.title}`,
          taskId: task.id,
          taskTitle: task.title,
        })
      }
    }

    return NextResponse.json({
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        columnPosition: task.column_position,
        position: task.position,
        isComplete: task.is_complete ?? false,
        isClosed: task.is_closed ?? false,
        createdAt: task.created_at,
        assignees: task.assignees || [],
        assigneeId: task.assignee_id ?? null,
        coverImageUrl: null,
        labels: responseLabels,
        subtaskCount: 0,
        totalEstimatedHours: 0,
        totalTimeSpent: 0,
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
    const body = await request.json()
    const parsed = validate(UpdateTaskSchema, body)
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const { id, title, description, columnPosition, position, assignees, labels, isComplete, isClosed, assigneeId, coverImageUrl } = parsed.data!
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
    if (columnPosition !== undefined) updates.column_position = columnPosition
    if (position !== undefined) updates.position = position
    if (assignees !== undefined) updates.assignees = assignees
    if (labels !== undefined)
      updates.labels = labels.map((l: { name: string; color?: string }) => `${l.name}||${l.color || getLabelColor(l.name)}`)
    if (isComplete !== undefined) updates.is_complete = isComplete
    if (isClosed !== undefined) updates.is_closed = isClosed
    if (assigneeId !== undefined) updates.assignee_id = assigneeId
    if (coverImageUrl !== undefined) updates.cover_image_url = coverImageUrl

    let prevAssigneeId: string | null = null
    let currentTitle = ""
    let currentDescription = ""
    const userId = getRequestUserId(request)

    // Snapshot do estado atual para o diff do histórico de atividades
    let currentTask: {
      title: string
      description: string
      column_position: number
      is_complete: boolean
      is_closed: boolean
      assignee_id: string | null
      cover_image_url: string | null
    } | null = null
    if (Object.keys(updates).length > 0) {
      const { data: snapshot, error: snapshotError } = await supabase
        .from("tasks")
        .select("title, description, column_position, is_complete, is_closed, assignee_id, cover_image_url")
        .eq("id", id)
        .single()
      if (snapshotError) throw snapshotError
      currentTask = snapshot
    }

    if (currentTask) {
      prevAssigneeId = currentTask.assignee_id ?? null
      currentTitle = currentTask.title || ""
      currentDescription = currentTask.description || ""
    } else if (assigneeId !== undefined) {
      const { data: current, error: currentError } = await supabase
        .from("tasks")
        .select("title, description, assignee_id")
        .eq("id", id)
        .single()
      if (currentError) throw currentError
      prevAssigneeId = current?.assignee_id || null
      currentTitle = current?.title || ""
      currentDescription = current?.description || ""
    }

    // Impede concluir tarefa com subtarefas pendentes (status diferente de APROVADO/FEITO)
    if (isComplete === true) {
      const { data: pendingSubtasks, error: pendingError } = await supabase
        .from("subtasks")
        .select("id, status")
        .eq("task_id", id)
        .not("status", "in", "(APROVADO,FEITO)")

      if (pendingError) throw pendingError

      if (pendingSubtasks && pendingSubtasks.length > 0) {
        return NextResponse.json(
          {
            error: "ERRO: SUBTAREFAS_PENDENTES",
            pendingSubtaskIds: pendingSubtasks.map((s) => s.id),
          },
          { status: 409 },
        )
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: taskError } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)

      if (taskError) throw taskError
    }

    if (labels !== undefined) {
      await syncCardLabels(supabase, id, labels)
    }

    // Histórico de atividades (diff entre o estado anterior e o novo)
    if (currentTask) {
      const old = currentTask
      if (title !== undefined && title !== old.title) {
        await logActivity(supabase, { taskId: id, userId, action: "title", oldValue: { title: old.title }, newValue: { title } })
      }
      if (description !== undefined && (description || "") !== (old.description || "")) {
        await logActivity(supabase, {
          taskId: id, userId, action: "description",
          oldValue: { description: old.description || "" },
          newValue: { description: description || "" },
        })
      }
      if (isComplete !== undefined && isComplete !== !!old.is_complete) {
        await logActivity(supabase, { taskId: id, userId, action: "status", oldValue: { isComplete: !!old.is_complete }, newValue: { isComplete } })
      }
      if (isClosed !== undefined && isClosed !== !!old.is_closed) {
        await logActivity(supabase, { taskId: id, userId, action: "archive", oldValue: { isClosed: !!old.is_closed }, newValue: { isClosed } })
      }
      if (columnPosition !== undefined && columnPosition !== old.column_position) {
        const { data: cols } = await supabase.from("columns").select("name, position")
        const nameOf = (pos: number) => (cols || []).find((c) => c.position === pos)?.name || `#${pos}`
        await logActivity(supabase, {
          taskId: id, userId, action: "move",
          oldValue: { column: nameOf(old.column_position) },
          newValue: { column: nameOf(columnPosition) },
        })
      }
      if (assigneeId !== undefined && (assigneeId ?? null) !== (old.assignee_id ?? null)) {
        const ids = [old.assignee_id, assigneeId].filter(Boolean) as string[]
        const { data: members } = ids.length > 0
          ? await supabase.from("team_members").select("id, name").in("id", ids)
          : { data: null }
        const nameOf = (uid: string | null) => (members || []).find((m) => m.id === uid)?.name || null
        await logActivity(supabase, {
          taskId: id, userId, action: "assignee",
          oldValue: { assigneeId: old.assignee_id, name: nameOf(old.assignee_id) },
          newValue: { assigneeId: assigneeId ?? null, name: nameOf(assigneeId ?? null) },
        })
      }
      if (coverImageUrl !== undefined && (coverImageUrl ?? null) !== (old.cover_image_url ?? null)) {
        await logActivity(supabase, {
          taskId: id, userId, action: "cover",
          oldValue: { url: old.cover_image_url },
          newValue: { url: coverImageUrl ?? null },
        })
      }
    }

    // Notifica o novo responsável (apenas quando houver mudança real)
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
          message: `Você foi atribuído à tarefa: ${currentTitle}`,
          task_id: id,
          board_id: DEFAULT_WORKSPACE_ID,
          task_title: currentTitle,
          from_user: "",
          read: false,
        })
        dispatchNotification({
          userId: assigneeId,
          type: "assignment",
          message: `Você foi atribuído à tarefa: ${currentTitle}`,
          taskId: id,
          taskTitle: currentTitle,
        })
      }

      // Integração Todoist: cria a tarefa para o novo responsável (assíncrono)
      void (async () => {
        try {
          const created = await createTodoistTask({
            content: currentTitle,
            description: currentDescription || undefined,
            priority: mapTodoistPriority(labels || []),
          })
          if (created?.id) {
            await supabase.from("tasks").update({ todoist_id: created.id }).eq("id", id)
          }
        } catch (err) {
          console.error("[todoist] falha na sincronização de responsável:", err)
        }
      })()
    }

    // Notify all users about task update
    // Determine task title for notification message
    let taskTitle = ''
    if (title) {
      taskTitle = title as string
    } else {
      const { data: taskData, error: taskFetchError } = await supabase
        .from('tasks')
        .select('title')
        .eq('id', id)
        .single()
      taskTitle = taskData?.title || ''
    }
    const { data: allUsers, error: usersError } = await supabase
      .from('team_members')
      .select('id')
    if (!usersError && allUsers && allUsers.length > 0) {
      const notifInserts = allUsers.map((u) => ({
        user_id: u.id,
        type: 'task_updated',
        message: `Tarefa atualizada: ${taskTitle}`,
        task_id: id,
        board_id: DEFAULT_WORKSPACE_ID,
        task_title: taskTitle,
        from_user: '',
        read: false,
      }))
      await supabase.from('notifications').insert(notifInserts)
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
    // Fetch task title before deletion for notification
    const { data: taskData, error: fetchError } = await supabase
      .from('tasks')
      .select('title')
      .eq('id', id)
      .single()
    const taskTitle = taskData?.title || ''

    const { error } = await supabase.from("tasks").delete().eq("id", id)

    if (error) throw error

    // Notify all users about task deletion
    const { data: allUsers, error: usersError } = await supabase
      .from('team_members')
      .select('id')
    if (!usersError && allUsers && allUsers.length > 0) {
      const notifInserts = allUsers.map((u) => ({
        user_id: u.id,
        type: 'task_deleted',
        message: `Tarefa excluída: ${taskTitle}`,
        task_id: id,
        board_id: DEFAULT_WORKSPACE_ID,
        task_title: taskTitle,
        from_user: '',
        read: false,
      }))
      await supabase.from('notifications').insert(notifInserts)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_DELETAR_TAREFA" },
      { status: 500 },
    )
  }
}

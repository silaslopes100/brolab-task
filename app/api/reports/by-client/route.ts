import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getRequestUserId } from "@/lib/activities"

const SECONDS_PER_HOUR = 3600
const DONE_SUBTASK_STATUSES = new Set(["APROVADO", "FEITO"])

type LabelRow = { id: string; name: string; color: string }
type CardLabelRow = { card_id: string; label_id: string }
type ColumnRow = { id: string; name: string; position: number }
type TaskRow = {
  id: string
  title: string
  status: string
  is_complete: boolean
  is_closed: boolean
  assignees: string[] | null
  created_at: string
  column_position: number | null
}
type SubtaskRow = {
  task_id: string
  estimated_hours: number | null
  time_spent: number | null
  status: string
}

function fmtHours(seconds: number): number {
  return Math.round((seconds / SECONDS_PER_HOUR) * 10) / 10
}

function parseDay(day: string): Date | null {
  const d = new Date(`${day}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function GET(request: NextRequest) {
  try {
    const userId = getRequestUserId(request)
    if (!userId) {
      return NextResponse.json({ error: "ERRO: SEM_SESSAO" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const labelIds = (searchParams.get("labelIds") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    if (labelIds.length === 0) {
      return NextResponse.json({ error: "ERRO: LABEL_IDS_OBRIGATORIO" }, { status: 400 })
    }

    const startParam = searchParams.get("start")
    const endParam = searchParams.get("end")
    const start = startParam ? parseDay(startParam) : null
    const end = endParam ? parseDay(endParam) : null
    if (start && end && start > end) {
      return NextResponse.json({ error: "ERRO: PERIODO_INVALIDO" }, { status: 400 })
    }

    const supabase = createAdminClient() ?? (await createClient())

    const [{ data: labelsRaw }, { data: cardLabelsRaw }] = await Promise.all([
      supabase.from("labels").select("id, name, color").in("id", labelIds),
      supabase.from("card_labels").select("card_id, label_id").in("label_id", labelIds),
    ])

    const labels: LabelRow[] = (labelsRaw || []).map((l: LabelRow) => l)
    const labelByTask = new Map<string, LabelRow[]>()
    for (const cl of (cardLabelsRaw || []) as CardLabelRow[]) {
      const label = labels.find((l) => l.id === cl.label_id)
      if (!label) continue
      const list = labelByTask.get(cl.card_id) || []
      list.push(label)
      labelByTask.set(cl.card_id, list)
    }

    const cardIds = [...labelByTask.keys()]
    if (cardIds.length === 0) {
      return NextResponse.json({
        requestedLabels: labels,
        labels: labels.map((l) => ({ id: l.id, name: l.name, color: l.color, taskCount: 0, doneCount: 0, estHours: 0, actualHours: 0 })),
        summary: { taskCount: 0, doneCount: 0, estHours: 0, actualHours: 0, progress: 0 },
        tasks: [],
      })
    }

    let tasksQuery = supabase
      .from("tasks")
      .select("id, title, status, is_complete, is_closed, assignees, created_at, column_position")
      .in("id", cardIds)
    if (start) tasksQuery = tasksQuery.gte("created_at", start.toISOString())
    if (end) tasksQuery = tasksQuery.lte("created_at", new Date(end.getTime() + 86400000 - 1).toISOString())

    const [{ data: tasksRaw }, { data: subtasksRaw }, { data: columnsRaw }] = await Promise.all([
      tasksQuery,
      supabase
        .from("subtasks")
        .select("task_id, estimated_hours, time_spent, status")
        .in("task_id", cardIds),
      supabase.from("columns").select("id, name, position"),
    ])

    const columns: ColumnRow[] = (columnsRaw || []).map((c: ColumnRow) => c)
    const columnByPosition = new Map<number, string>()
    for (const c of columns) columnByPosition.set(c.position, c.name)

    const subtasksByTask = new Map<string, SubtaskRow[]>()
    for (const st of (subtasksRaw || []) as SubtaskRow[]) {
      const list = subtasksByTask.get(st.task_id) || []
      list.push(st)
      subtasksByTask.set(st.task_id, list)
    }

    const labelStats = new Map<string, { taskCount: number; doneCount: number; estSeconds: number; actualSeconds: number }>()
    for (const l of labels) {
      labelStats.set(l.id, { taskCount: 0, doneCount: 0, estSeconds: 0, actualSeconds: 0 })
    }

    const tasks = ((tasksRaw || []) as TaskRow[]).map((t) => {
      const tLabels = labelByTask.get(t.id) || []
      const subtasks = subtasksByTask.get(t.id) || []
      const totalSubtasks = subtasks.length
      const doneSubtasks = subtasks.filter((s) => DONE_SUBTASK_STATUSES.has(s.status)).length
      const progress =
        totalSubtasks > 0
          ? Math.round((doneSubtasks / totalSubtasks) * 100)
          : t.is_complete
            ? 100
            : 0
      const estSeconds = subtasks.reduce((acc, s) => acc + Math.max(0, s.estimated_hours || 0) * SECONDS_PER_HOUR, 0)
      const actualSeconds = subtasks.reduce((acc, s) => acc + Math.max(0, s.time_spent || 0), 0)

      for (const l of tLabels) {
        const st = labelStats.get(l.id)!
        st.taskCount += 1
        if (t.is_complete) st.doneCount += 1
        st.estSeconds += estSeconds
        st.actualSeconds += actualSeconds
      }

      return {
        id: t.id,
        title: t.title,
        status: t.status,
        columnName: t.column_position !== null ? columnByPosition.get(t.column_position) || null : null,
        isComplete: t.is_complete,
        assignees: t.assignees || [],
        createdAt: t.created_at,
        labels: tLabels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
        totalSubtasks,
        doneSubtasks,
        progress,
        estHours: fmtHours(estSeconds),
        actualHours: fmtHours(actualSeconds),
        _estSeconds: estSeconds,
        _actualSeconds: actualSeconds,
      }
    })

    const labelList = labels.map((l) => {
      const st = labelStats.get(l.id)!
      return {
        id: l.id,
        name: l.name,
        color: l.color,
        taskCount: st.taskCount,
        doneCount: st.doneCount,
        estHours: fmtHours(st.estSeconds),
        actualHours: fmtHours(st.actualSeconds),
      }
    })

const totalTasks = tasks.length
      const totalDone = tasks.filter((t) => t.isComplete).length
      const totalEstSeconds = tasks.reduce((acc, t) => acc + t._estSeconds, 0)
      const totalActualSeconds = tasks.reduce((acc, t) => acc + t._actualSeconds, 0)

    return NextResponse.json({
      requestedLabels: labels,
      labels: labelList,
      summary: {
        taskCount: totalTasks,
        doneCount: totalDone,
        estHours: fmtHours(totalEstSeconds),
        actualHours: fmtHours(totalActualSeconds),
        progress: totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0,
      },
      tasks: tasks.map(({ _estSeconds: _e, _actualSeconds: _a, ...rest }) => rest),
    })
  } catch (err) {
    console.error("Error in by-client report:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_GERAR_RELATORIO" },
      { status: 500 },
    )
  }
}
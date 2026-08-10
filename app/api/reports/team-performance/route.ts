import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getRequestUserId } from "@/lib/activities"

const SECONDS_PER_HOUR = 3600
const DEFAULT_PERIOD_DAYS = 7
const BURNDOWN_DAYS = 7

type Member = { id: string; name: string; username: string }
type SubtaskRow = {
  id: string
  task_id: string
  title: string
  estimated_hours: number | null
  time_spent: number | null
  status: string
  assignees: string[] | null
  assignee_id: string | null
  created_at: string
}
type TaskRow = {
  id: string
  title: string
  assignees: string[] | null
  is_complete: boolean
  is_closed: boolean
  created_at: string
}
type ActivityRow = {
  task_id: string
  user_id: string | null
  action: string
  new_value: Record<string, unknown> | null
  created_at: string
}

function parseDay(day: string): Date {
  const d = new Date(`${day}T00:00:00`)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

// Resolve o responsável de uma subtarefa: assignee_id (UUID) tem prioridade;
// sem ele, tenta casar o primeiro nome de "assignees" (array flexível) com um membro.
function resolveSubtaskMember(subtask: SubtaskRow, memberBy: Map<string, Member>, byName: Map<string, Member>): Member | null {
  if (subtask.assignee_id && memberBy.has(subtask.assignee_id)) return memberBy.get(subtask.assignee_id)!
  for (const name of subtask.assignees || []) {
    const hit = byName.get(String(name).trim().toUpperCase())
    if (hit) return hit
  }
  return null
}

// Conclusão é atribuída ao actor (user_id do evento); sem actor, cai no nome dos assignees da tarefa.
function resolveTaskMember(task: TaskRow, activity: ActivityRow | null, memberBy: Map<string, Member>, byName: Map<string, Member>): Member | null {
  if (activity?.user_id && memberBy.has(activity.user_id)) return memberBy.get(activity.user_id)!
  for (const name of task.assignees || []) {
    const hit = byName.get(String(name).trim().toUpperCase())
    if (hit) return hit
  }
  return null
}

function fmtHours(seconds: number): number {
  return Math.round((seconds / SECONDS_PER_HOUR) * 10) / 10
}

export async function GET(request: NextRequest) {
  try {
    const userId = getRequestUserId(request)
    if (!userId) {
      return NextResponse.json({ error: "ERRO: SEM_SESSAO" }, { status: 401 })
    }

    const supabase = createAdminClient() ?? (await createClient())

    const { searchParams } = new URL(request.url)
    const today = new Date()
    const endParam = searchParams.get("end")
    const startParam = searchParams.get("start")
    const memberFilter = searchParams.get("memberId")

    const end = endParam ? parseDay(endParam) : today
    const start = startParam ? parseDay(startParam) : new Date(end.getTime() - (DEFAULT_PERIOD_DAYS - 1) * 86400000)
    if (start > end) {
      return NextResponse.json({ error: "ERRO: PERIODO_INVALIDO" }, { status: 400 })
    }

    const startIso = start.toISOString()
    const endInclusive = new Date(end.getTime() + 86400000 - 1).toISOString()

    const [{ data: membersRaw }, { data: subtasksRaw }, { data: tasksRaw }, { data: activitiesRaw }] =
      await Promise.all([
        supabase.from("team_members").select("id, name, username").order("name"),
        supabase
          .from("subtasks")
          .select("id, task_id, title, estimated_hours, time_spent, status, assignees, assignee_id, created_at")
          .gte("created_at", startIso)
          .lte("created_at", endInclusive),
        supabase
          .from("tasks")
          .select("id, title, assignees, is_complete, is_closed, created_at")
          .gte("created_at", startIso)
          .lte("created_at", endInclusive),
        supabase
          .from("task_activities")
          .select("task_id, user_id, action, new_value, created_at")
          .eq("action", "status")
          .gte("created_at", startIso)
          .lte("created_at", endInclusive),
      ])

    const members: Member[] = (membersRaw || []).map((m: { id: string; name: string; username: string }) => ({
      id: m.id,
      name: m.name || m.username,
      username: m.username,
    }))
    const memberBy = new Map<string, Member>()
    const byName = new Map<string, Member>()
    for (const m of members) {
      memberBy.set(m.id, m)
      byName.set(m.name.trim().toUpperCase(), m)
      if (m.username) byName.set(`@${m.username.trim().toUpperCase()}`, m)
    }

    const unassigned: Member = { id: "UNASSIGNED", name: "SEM_RESPONSAVEL", username: "" }
    const rows = new Map<string, { member: Member; completedTasks: number; estSeconds: number; actualSeconds: number; overdueCount: number; overdueSeconds: number }>()

    function ensureRow(member: Member | null) {
      const key = member?.id || unassigned.id
      let row = rows.get(key)
      if (!row) {
        row = { member: member || unassigned, completedTasks: 0, estSeconds: 0, actualSeconds: 0, overdueCount: 0, overdueSeconds: 0 }
        rows.set(key, row)
      }
      return row
    }

    // ----- Subtarefas no período: horas estimadas vs realizadas + atrasadas -----
    const subtasks: SubtaskRow[] = (subtasksRaw || []).map((s: SubtaskRow) => s)
    for (const st of subtasks) {
      const row = ensureRow(resolveSubtaskMember(st, memberBy, byName))
      row.estSeconds += Math.max(0, st.estimated_hours || 0) * SECONDS_PER_HOUR
      row.actualSeconds += Math.max(0, st.time_spent || 0)
      const est = Math.max(0, st.estimated_hours || 0) * SECONDS_PER_HOUR
      if (est > 0 && (st.time_spent || 0) > est) {
        row.overdueCount += 1
        row.overdueSeconds += (st.time_spent || 0) - est
      }
    }

    // ----- Conclusões no período (eventos task_activities) -----
    const tasks = new Map<string, TaskRow>()
    for (const t of (tasksRaw || []) as TaskRow[]) tasks.set(t.id, t)

    const completions = (activitiesRaw || []).filter(
      (a: ActivityRow) => a.new_value && (a.new_value as { isComplete?: unknown }).isComplete === true,
    )
    const completedByMember = new Map<string, number>()
    for (const act of completions as ActivityRow[]) {
      const task = tasks.get(act.task_id)
      const member = task
        ? resolveTaskMember(task, act, memberBy, byName)
        : act.user_id && memberBy.has(act.user_id)
          ? memberBy.get(act.user_id)!
          : null
      const key = member?.id || unassigned.id
      completedByMember.set(key, (completedByMember.get(key) || 0) + 1)
    }
    for (const [key, n] of completedByMember) {
      const row = ensureRow(key === unassigned.id ? null : memberBy.get(key) || null)
      row.completedTasks += n
    }

    // ----- Burndown semanal (janela de 7 dias terminando no fim do período) -----
    const burndownStart = new Date(Math.max(start.getTime(), end.getTime() - (BURNDOWN_DAYS - 1) * 86400000))
    const days: Array<{ date: string; label: string; completed: number; cumulative: number }> = []
    let cumulative = 0
    for (let i = 0; i < BURNDOWN_DAYS; i++) {
      const day = new Date(burndownStart.getTime() + i * 86400000)
      if (day > end) break
      const dayStart = day.toISOString()
      const dayEnd = new Date(day.getTime() + 86400000 - 1).toISOString()
      const picked = (completions as ActivityRow[]).filter(
        (a) => {
          const t = a.created_at
          return t >= dayStart && t <= dayEnd
        },
      )
      const dayLabel = day.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase().replace(".", "")
      cumulative += picked.length
      days.push({
        date: day.toLocaleDateString("pt-BR").padStart(2, "0"),
        label: dayLabel.slice(0, 2),
        completed: picked.length,
        cumulative,
      })
    }

    // ----- Montagem da resposta -----
    const memberList = [...rows.values()]
      .map((r) => ({
        id: r.member.id,
        name: r.member.name,
        username: r.member.username,
        completedTasks: r.completedTasks,
        estHours: fmtHours(r.estSeconds),
        actualHours: fmtHours(r.actualSeconds),
        overdueCount: r.overdueCount,
        overdueHours: fmtHours(r.overdueSeconds),
      }))
      .sort((a, b) => b.completedTasks - a.completedTasks || b.actualHours - a.actualHours)

    const total = rows.size > 0
      ? [...rows.values()].reduce(
          (acc, r) => {
            acc.completedTasks += r.completedTasks
            acc.estSeconds += r.estSeconds
            acc.actualSeconds += r.actualSeconds
            acc.overdueCount += r.overdueCount
            acc.overdueSeconds += r.overdueSeconds
            return acc
          },
          { completedTasks: 0, estSeconds: 0, actualSeconds: 0, overdueCount: 0, overdueSeconds: 0 },
        )
      : { completedTasks: 0, estSeconds: 0, actualSeconds: 0, overdueCount: 0, overdueSeconds: 0 }

    return NextResponse.json({
      start: start.toISOString(),
      end: end.toISOString(),
      summary: {
        completedTasks: total.completedTasks,
        estHours: fmtHours(total.estSeconds),
        actualHours: fmtHours(total.actualSeconds),
        overdueCount: total.overdueCount,
        overdueHours: fmtHours(total.overdueSeconds),
        memberCount: memberList.filter((m) => m.id !== "UNASSIGNED").length,
      },
      members: memberList,
      burndown: days,
    })
  } catch (err) {
    console.error("Error in team-performance report:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_GERAR_RELATORIO" },
      { status: 500 },
    )
  }
}
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

const STATUS_ORDER = ["BACKLOG", "FAZENDO", "ALTERAÇÕES", "APROVADO", "FEITO"]

export async function POST(request: NextRequest) {
  try {
    const { subtaskId, newStatus } = await request.json()
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const { data: subtask, error: fetchError } = await supabase
      .from("subtasks")
      .select("*")
      .eq("id", subtaskId)
      .single()

    if (fetchError || !subtask) {
      return NextResponse.json(
        { error: "ERRO: SUBTAREFA_NAO_ENCONTRADA" },
        { status: 404 },
      )
    }

    const oldStatus = subtask.status
    const oldIndex = STATUS_ORDER.indexOf(oldStatus)
    const newIndex = STATUS_ORDER.indexOf(newStatus)

    let timerStartedAt = subtask.timer_started_at
    let timeSpent = subtask.time_spent || 0

    if (oldIndex === 0 && newIndex > 0) {
      timerStartedAt = new Date().toISOString()
    }

    if (newIndex >= 3 && timerStartedAt) {
      const elapsed = (Date.now() - new Date(timerStartedAt).getTime()) / 1000
      timeSpent += elapsed
      timerStartedAt = null
    }

    const { error: updateError } = await supabase
      .from("subtasks")
      .update({
        status: newStatus,
        timer_started_at: timerStartedAt,
        time_spent: timeSpent,
      })
      .eq("id", subtaskId)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      timeSpent: Math.round(timeSpent),
      timerStartedAt,
    })
  } catch (err) {
    console.error("Error updating timer:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_ATUALIZAR_CRONOMETRO" },
      { status: 500 },
    )
  }
}

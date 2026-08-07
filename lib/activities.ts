import type { NextRequest } from "next/server"

export type ActivityClient = {
  from: (table: string) => any
}

// Usuário autenticado identificado pelo middleware (x-user-id)
export function getRequestUserId(request: NextRequest): string | null {
  return request.headers.get("x-user-id") || null
}

// Registra uma atividade no histórico da tarefa.
// Nunca lança exceção: falhas de log não podem travar o fluxo principal.
export async function logActivity(
  supabase: ActivityClient,
  input: {
    taskId: string
    userId?: string | null
    action: string
    oldValue?: Record<string, unknown> | null
    newValue?: Record<string, unknown> | null
  },
): Promise<void> {
  try {
    await supabase.from("task_activities").insert({
      task_id: input.taskId,
      user_id: input.userId || null,
      action: input.action,
      old_value: input.oldValue ?? null,
      new_value: input.newValue ?? null,
    })
  } catch (err) {
    console.error("Erro ao registrar atividade:", err)
  }
}

export async function resolveUserIdByUsername(
  supabase: ActivityClient,
  username: string,
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("team_members")
      .select("id")
      .eq("username", username)
      .maybeSingle()
    return data?.id || null
  } catch {
    return null
  }
}

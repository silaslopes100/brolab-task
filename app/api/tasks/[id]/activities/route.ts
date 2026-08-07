import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/tasks/[id]/activities — lista ordenada por data decrescente
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = createAdminClient() ?? (await createClient())

    const { data: activities, error } = await supabase
      .from("task_activities")
      .select("id, task_id, user_id, action, old_value, new_value, created_at, team_members(name, avatar_url)")
      .eq("task_id", id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({
      activities: ((activities || []) as any[]).map((a: any) => ({
        id: a.id,
        taskId: a.task_id,
        userId: a.user_id,
        action: a.action,
        oldValue: a.old_value ?? null,
        newValue: a.new_value ?? null,
        createdAt: a.created_at,
        userName: a.team_members?.name || null,
        userAvatarUrl: a.team_members?.avatar_url || null,
      })),
    })
  } catch (err) {
    console.error("Error fetching activities:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_BUSCAR_ATIVIDADES" },
      { status: 500 },
    )
  }
}

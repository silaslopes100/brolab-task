import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }, { status: 500 })
    }
    const [columnsRes, tasksRes] = await Promise.all([
      supabase.from("columns").select("*").order("position"),
      supabase.from("tasks").select("*").eq("is_closed", true).order("updated_at", { ascending: false }),
    ])
    if (tasksRes.error) throw tasksRes.error
    const columnsMap = new Map((columnsRes.data || []).map((c) => [c.position, c.name]))
    const cards = (tasksRes.data || []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      columnName: columnsMap.get(t.column_position) || "N/A",
      updatedAt: t.updated_at,
      labels: (t.labels || []).map((raw: string) => {
        const [name, color] = raw.split("||")
        return { id: name, name, color: color || "#888888" }
      }),
    }))
    return NextResponse.json({ cards })
  } catch (err) {
    console.error("Error fetching archived cards:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_BUSCAR_ARQUIVADOS" }, { status: 500 })
  }
}

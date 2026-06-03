import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  try {
    const { boardId } = await params
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }, { status: 500 })
    }
    const { data, error } = await supabase
      .from("tasks")
      .select("*, columns!inner(name)")
      .eq("is_closed", true)
      .order("updated_at", { ascending: false })
    if (error) throw error
    const cards = (data || []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      columnName: t.columns?.name || "N/A",
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

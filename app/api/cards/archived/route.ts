import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function getLabelColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return ["#FFFFFF", "#6B7280", "#84CC16", "#A3E635", "#F97316", "#EF4444", "#22C55E"][Math.abs(hash) % 7]
}

export async function GET() {
  try {
    const supabase = createAdminClient() ?? (await createClient())
    const [columnsRes, tasksRes, labelsRes, cardLabelsRes] = await Promise.all([
      supabase.from("columns").select("*").order("position"),
      supabase.from("tasks").select("*").eq("is_closed", true).order("created_at", { ascending: false }),
      supabase.from("labels").select("id, name, color"),
      supabase.from("card_labels").select("card_id, label_id"),
    ])
    if (tasksRes.error) throw tasksRes.error

    const columnsMap = new Map((columnsRes.data || []).map((c) => [c.position, c.name]))

    const labelById = new Map<string, { id: string; name: string; color: string }>()
    for (const l of labelsRes.data || []) {
      labelById.set(l.id, { id: l.id, name: l.name, color: l.color })
    }
    const labelIdsByCard: Record<string, string[]> = {}
    for (const cl of cardLabelsRes.data || []) {
      if (!labelIdsByCard[cl.card_id]) labelIdsByCard[cl.card_id] = []
      labelIdsByCard[cl.card_id].push(cl.label_id)
    }

    const cards = (tasksRes.data || []).map((t) => {
      const labelMap = new Map<string, { id: string; name: string; color: string }>()
      for (const labelId of labelIdsByCard[t.id] || []) {
        const label = labelById.get(labelId)
        if (label) labelMap.set(label.id, label)
      }
      for (const raw of t.labels || []) {
        const [name, color] = raw.split("||")
        const legacy = { id: name, name, color: color || getLabelColor(name) }
        if (!labelById.has(legacy.id)) labelMap.set(legacy.id, legacy)
      }
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        columnName: columnsMap.get(t.column_position) || "N/A",
        updatedAt: t.created_at,
        labels: [...labelMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
      }
    })
    return NextResponse.json({ cards })
  } catch (err) {
    console.error("Error fetching archived cards:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_BUSCAR_ARQUIVADOS" }, { status: 500 })
  }
}

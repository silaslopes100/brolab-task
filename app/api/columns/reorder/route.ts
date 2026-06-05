import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }, { status: 500 })
    }

    const { columns: cols } = await request.json()
    if (!Array.isArray(cols)) {
      return NextResponse.json({ error: "Formato inválido: esperado array de colunas" }, { status: 400 })
    }

    for (const col of cols) {
      if (!col.id || typeof col.position !== "number") {
        return NextResponse.json({ error: "Cada coluna deve ter id e position" }, { status: 400 })
      }
    }

    for (const col of cols) {
      const { error } = await supabase
        .from("columns")
        .update({ position: col.position })
        .eq("name", col.id)
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error reordering columns:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_REORDENAR_COLUNAS" }, { status: 500 })
  }
}

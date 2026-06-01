import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name: oldName } = await params
    const { name: newName } = await request.json()

    if (!newName || typeof newName !== "string") {
      return NextResponse.json({ error: "Novo nome é obrigatório" }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }, { status: 500 })
    }

    const normalizedNew = newName.toUpperCase()

    const { error: colError } = await supabase
      .from("columns")
      .update({ name: normalizedNew })
      .eq("name", oldName)

    if (colError) throw colError

    const { error: taskError } = await supabase
      .from("tasks")
      .update({ status: normalizedNew })
      .eq("status", oldName)

    if (taskError) throw taskError

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error renaming column:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_RENOMEAR_COLUNA" }, { status: 500 })
  }
}

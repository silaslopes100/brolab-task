import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ labelId: string }> }) {
  try {
    const { labelId } = await params
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }, { status: 500 })
    }
    const { error } = await supabase.from("workspace_labels").delete().eq("id", labelId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting workspace label:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_DELETAR_ETIQUETA" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ labelId: string }> }) {
  try {
    const { labelId } = await params
    const body = await request.json()
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }, { status: 500 })
    }
    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name.toUpperCase()
    if (body.color !== undefined) updates.color = body.color
    const { data, error } = await supabase.from("workspace_labels").update(updates).eq("id", labelId).select().single()
    if (error) throw error
    return NextResponse.json({ label: data })
  } catch (err) {
    console.error("Error updating workspace label:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_ATUALIZAR_ETIQUETA" }, { status: 500 })
  }
}

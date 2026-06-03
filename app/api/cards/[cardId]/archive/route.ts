import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }, { status: 500 })
    }
    const { error } = await supabase.from("tasks").update({ is_closed: true }).eq("id", cardId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error archiving card:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_ARQUIVAR" }, { status: 500 })
  }
}

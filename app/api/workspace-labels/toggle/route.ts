import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cardId, labelId } = body
    if (!cardId || !labelId) {
      return NextResponse.json({ error: "cardId e labelId obrigatórios" }, { status: 400 })
    }
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }, { status: 500 })
    }
    const { data: existing } = await supabase
      .from("card_labels")
      .select("*")
      .eq("card_id", cardId)
      .eq("label_id", labelId)
      .maybeSingle()
    if (existing) {
      await supabase.from("card_labels").delete().eq("card_id", cardId).eq("label_id", labelId)
      return NextResponse.json({ active: false })
    } else {
      await supabase.from("card_labels").insert({ card_id: cardId, label_id: labelId })
      return NextResponse.json({ active: true })
    }
  } catch (err) {
    console.error("Error toggling workspace label:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_ALTERAR_ETIQUETA" }, { status: 500 })
  }
}

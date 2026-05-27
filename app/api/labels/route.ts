import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: labels, error } = await supabase
      .from("labels")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({ labels })
  } catch {
    return NextResponse.json({ error: "ERRO: FALHA_AO_BUSCAR_ETIQUETAS" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, color } = await request.json()
    const supabase = await createClient()

    const { data: label, error } = await supabase
      .from("labels")
      .insert({ name: name.toUpperCase(), color })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ label })
  } catch {
    return NextResponse.json({ error: "ERRO: FALHA_AO_CRIAR_ETIQUETA" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from("labels").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "ERRO: FALHA_AO_DELETAR_ETIQUETA" }, { status: 500 })
  }
}

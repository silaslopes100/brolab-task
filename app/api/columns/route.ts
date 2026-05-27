import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: columns, error } = await supabase
      .from("columns")
      .select("*")
      .order("position", { ascending: true })

    if (error) throw error

    return NextResponse.json({ columns })
  } catch {
    return NextResponse.json({ error: "ERRO: FALHA_AO_BUSCAR_COLUNAS" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, position } = await request.json()
    const supabase = await createClient()

    const { data: column, error } = await supabase
      .from("columns")
      .insert({ name: name.toUpperCase(), position })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ column })
  } catch {
    return NextResponse.json({ error: "ERRO: FALHA_AO_CRIAR_COLUNA" }, { status: 500 })
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
    const { error } = await supabase.from("columns").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "ERRO: FALHA_AO_DELETAR_COLUNA" }, { status: 500 })
  }
}

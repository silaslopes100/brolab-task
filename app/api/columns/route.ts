import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createAdminClient() ?? (await createClient())

    const { data: columns, error } = await supabase
      .from("columns")
      .select("*")
      .order("position", { ascending: true })

    if (error) throw error

    return NextResponse.json({
      columns: (columns || []).map((c) => ({
        id: c.name,
        name: c.name,
        position: c.position,
      })),
    })
  } catch (err) {
    console.error("Error fetching columns:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_BUSCAR_COLUNAS" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, position } = await request.json()
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const id = name.toUpperCase()

    const { data, error } = await supabase
      .from("columns")
      .insert({
        name: id,
        position: position ?? 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      column: { id: data.name, name: data.name, position: data.position },
    })
  } catch (err) {
    console.error("Error creating column:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_CRIAR_COLUNA" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { columns: cols } = await request.json()
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
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
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_REORDENAR_COLUNAS" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const { error } = await supabase.from("columns").delete().eq("name", id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting column:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_DELETAR_COLUNA" },
      { status: 500 },
    )
  }
}

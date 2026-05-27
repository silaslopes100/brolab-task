import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, username, email, role, is_admin")
      .order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        isAdmin: u.is_admin,
      })),
    })
  } catch {
    return NextResponse.json({ error: "ERRO: FALHA_AO_BUSCAR_USUÁRIOS" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, username, email, password, role, isAdmin } = await request.json()
    const supabase = await createClient()

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        name: name.toUpperCase().replace(/\s+/g, "_"),
        username: username.toLowerCase().replace(/\s+/g, "."),
        email: email.toLowerCase(),
        password_hash: password,
        role: role?.toUpperCase().replace(/\s+/g, "_") || "COLLABORATOR",
        is_admin: isAdmin || false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.is_admin,
      },
    })
  } catch {
    return NextResponse.json({ error: "ERRO: FALHA_AO_CRIAR_USUÁRIO" }, { status: 500 })
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
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "ERRO: FALHA_AO_DELETAR_USUÁRIO" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, name, email, password, role } = await request.json()
    const supabase = await createClient()

    const updates: Record<string, string> = {}
    if (name) updates.name = name.toUpperCase().replace(/\s+/g, "_")
    if (email) updates.email = email.toLowerCase()
    if (password) updates.password_hash = password
    if (role) updates.role = role.toUpperCase().replace(/\s+/g, "_")

    const { data: user, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.is_admin,
      },
    })
  } catch {
    return NextResponse.json({ error: "ERRO: FALHA_AO_ATUALIZAR_USUÁRIO" }, { status: 500 })
  }
}

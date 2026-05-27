import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const supabase = await createClient()

    // Buscar usuário por email ou username
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .or(`email.eq.${email.toLowerCase()},username.eq.${email.toLowerCase().replace("@", "")}`)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: "ERRO: CREDENCIAIS_INVÁLIDAS" },
        { status: 401 }
      )
    }

    // Verificar senha (em produção usar bcrypt)
    if (user.password_hash !== password) {
      return NextResponse.json(
        { error: "ERRO: CREDENCIAIS_INVÁLIDAS" },
        { status: 401 }
      )
    }

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
    return NextResponse.json(
      { error: "ERRO: FALHA_NO_SERVIDOR" },
      { status: 500 }
    )
  }
}

import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const loginIdentifier = email.toLowerCase().trim()
    const usernameWithAt = loginIdentifier.startsWith("@")
      ? loginIdentifier
      : `@${loginIdentifier.replace(/^@/, "")}`

    let user = null
    let error = null

    const byEmail = await supabase
      .from("team_members")
      .select("*")
      .eq("email", loginIdentifier)
      .maybeSingle()

    if (byEmail.data) {
      user = byEmail.data
    } else {
      const byUsername = await supabase
        .from("team_members")
        .select("*")
        .eq("username", usernameWithAt)
        .maybeSingle()
      user = byUsername.data
      error = byUsername.error
    }

    if (error || !user) {
      return NextResponse.json(
        { error: "ERRO: CREDENCIAIS_INVÁLIDAS" },
        { status: 401 },
      )
    }

    let passwordValid = false

    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      passwordValid = await bcrypt.compare(password, user.password)
    } else if (user.password === password) {
      passwordValid = true
      const hashed = await bcrypt.hash(password, 10)
      await supabase.from("team_members").update({ password: hashed }).eq("id", user.id)
    }

    if (!passwordValid) {
      return NextResponse.json(
        { error: "ERRO: CREDENCIAIS_INVÁLIDAS" },
        { status: 401 },
      )
    }

    const jwtPayload = { userId: user.id, username: user.username, role: user.role }
    const accessToken = signAccessToken(jwtPayload)
    const refreshToken = signRefreshToken(jwtPayload)

    const userData = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      role_id: user.role_id,
      isAdmin: user.role === "ADMIN_TOTAL" || user.role === "ADMIN",
    }

    const response = NextResponse.json({ user: userData, accessToken })

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 60 * 60 * 24 * 7,
    })

    response.cookies.set("access_token", accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    })

    return response
  } catch {
    return NextResponse.json(
      { error: "ERRO: FALHA_NO_SERVIDOR" },
      { status: 500 },
    )
  }
}

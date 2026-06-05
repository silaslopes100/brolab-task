import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { signAccessToken, signRefreshToken, getAccessTokenExpiry, getRefreshTokenExpiry } from "@/lib/auth/jwt"
import { LoginSchema, validate } from "@/lib/validation"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rateCheck = checkRateLimit(`login:${ip}`)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "ERRO: MUITAS_TENTATIVAS_AGUARDE" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateCheck.resetInMs / 1000)) } },
      )
    }

    const body = await request.json()
    const parsed = validate(LoginSchema, body)
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const { email, password } = parsed.data!
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

    const isProd = process.env.NODE_ENV === "production"

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: getRefreshTokenExpiry(),
    })

    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: getAccessTokenExpiry(),
    })

    return response
  } catch {
    return NextResponse.json(
      { error: "ERRO: FALHA_NO_SERVIDOR" },
      { status: 500 },
    )
  }
}

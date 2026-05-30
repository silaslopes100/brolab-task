import { NextRequest, NextResponse } from "next/server"
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/auth/jwt"

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value
  if (!refreshToken) {
    return NextResponse.json({ error: "ERRO: TOKEN_AUSENTE" }, { status: 401 })
  }

  const payload = verifyRefreshToken(refreshToken)
  if (!payload) {
    return NextResponse.json({ error: "ERRO: TOKEN_INVALIDO" }, { status: 401 })
  }

  const newPayload = { userId: payload.userId, username: payload.username, role: payload.role }
  const newAccessToken = signAccessToken(newPayload)
  const newRefreshToken = signRefreshToken(newPayload)

  const response = NextResponse.json({ accessToken: newAccessToken })

  response.cookies.set("refresh_token", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 60 * 60 * 24 * 7,
  })

  response.cookies.set("access_token", newAccessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  })

  return response
}

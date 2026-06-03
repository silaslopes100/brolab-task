import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAccessToken } from "@/lib/auth/jwt"

const PUBLIC_ROUTES = ["/api/auth/login", "/api/auth/refresh", "/api/auth/me", "/api/auth/logout"]
const MUTATION_METHODS = ["POST", "PATCH", "PUT", "DELETE"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get("access_token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

  if (!token) {
    return NextResponse.json({ error: "ERRO: AUTENTICACAO_REQUERIDA" }, { status: 401 })
  }

  const payload = verifyAccessToken(token)
  if (!payload) {
    return NextResponse.json({ error: "ERRO: TOKEN_INVALIDO" }, { status: 401 })
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-user-id", payload.userId)
  requestHeaders.set("x-username", payload.username)
  requestHeaders.set("x-role", payload.role)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: "/api/:path*",
}

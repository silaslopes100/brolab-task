import { NextRequest, NextResponse } from "next/server"

// Proxy para a API do Unsplash (mantém a access key no servidor).
// Endpoint: GET /api/unsplash?query=<palavras-chave>&page=<n>
export async function GET(request: NextRequest) {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY
    if (!accessKey) {
      return NextResponse.json(
        { error: "ERRO: UNSPLASH_KEY_NAO_CONFIGURADA" },
        { status: 503 },
      )
    }

    const { searchParams } = new URL(request.url)
    const query = (searchParams.get("query") || "abstract").trim()
    const page = Math.min(Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1), 10)

    if (!query) {
      return NextResponse.json({ error: "ERRO: QUERY_OBRIGATORIA" }, { status: 400 })
    }

    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&page=${page}`,
      {
        headers: { Authorization: `Client-ID ${accessKey}` },
        next: { revalidate: 0 },
      },
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: "ERRO: FALHA_AO_BUSCAR_IMAGENS" },
        { status: 502 },
      )
    }

    const data = await res.json()

    const results = (data.results || []).map((p: {
      id: string
      urls?: { thumb?: string; regular?: string }
      alt_description?: string | null
      description?: string | null
      user?: { name?: string }
      links?: { html?: string }
    }) => ({
      id: p.id,
      thumb: p.urls?.thumb || "",
      regular: p.urls?.regular || "",
      alt: p.alt_description || p.description || "Imagem",
      creditName: p.user?.name || "",
      creditLink: p.links?.html || "",
    }))

    return NextResponse.json({ results, total: data.total || 0 })
  } catch (err) {
    console.error("Error searching Unsplash:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_NO_SERVIDOR" },
      { status: 500 },
    )
  }
}

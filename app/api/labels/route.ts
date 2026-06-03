import { NextRequest, NextResponse } from "next/server"

const LABEL_COLORS = [
  "#FFFFFF",
  "#6B7280",
  "#84CC16",
  "#A3E635",
  "#F97316",
  "#EF4444",
  "#22C55E",
]

function getLabelColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length]
}

export async function GET() {
  try {
    return NextResponse.json({ labels: [] })
  } catch {
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_BUSCAR_ETIQUETAS" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()
    const label = {
      id: name.toUpperCase(),
      name: name.toUpperCase(),
      color: getLabelColor(name.toUpperCase()),
    }
    return NextResponse.json({ label })
  } catch {
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_CRIAR_ETIQUETA" },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  return NextResponse.json({ success: true })
}

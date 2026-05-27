import { NextRequest, NextResponse } from "next/server"

const DEFAULT_COLUMNS = [
  "BACKLOG",
  "FAZENDO",
  "ALTERAÇÕES",
  "APROVADO",
  "FEITO",
]

export async function GET() {
  try {
    const columns = DEFAULT_COLUMNS.map((name, index) => ({
      id: name,
      name,
      position: index,
    }))

    return NextResponse.json({ columns })
  } catch {
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_BUSCAR_COLUNAS" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, position } = await request.json()
    const id = name.toUpperCase()

    return NextResponse.json({
      column: {
        id,
        name: id,
        position: position || DEFAULT_COLUMNS.length,
      },
    })
  } catch {
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_CRIAR_COLUNA" },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  return NextResponse.json({ success: true })
}

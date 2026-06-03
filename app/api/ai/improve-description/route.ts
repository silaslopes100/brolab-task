import { NextRequest, NextResponse } from "next/server"

const rateLimit = new Map<string, { count: number; resetAt: number }>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, cardTitle } = body

    if (!description || description.length < 5) {
      return NextResponse.json({ error: "Descrição deve ter no mínimo 5 caracteres" }, { status: 400 })
    }

    const userId = request.headers.get("x-user-id") || "anonymous"
    const now = Date.now()
    const entry = rateLimit.get(userId)
    if (entry && entry.resetAt > now) {
      if (entry.count >= 10) {
        return NextResponse.json({ error: "Limite de requisições. Aguarde 1 minuto." }, { status: 429 })
      }
      entry.count++
    } else {
      rateLimit.set(userId, { count: 1, resetAt: now + 60000 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY não configurada" }, { status: 500 })
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `Você é um assistente de produtividade.
Melhore a descrição abaixo de uma tarefa chamada "${cardTitle}".
Mantenha o contexto original, corrija gramática, torne mais clara e profissional.
Responda APENAS com a descrição melhorada, sem explicações ou comentários extras.
Máximo de 3 parágrafos curtos.

Descrição original:
${description}`,
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("OpenRouter API error:", err)
      return NextResponse.json({ error: "Erro ao melhorar descrição" }, { status: 502 })
    }

    const data = await response.json()
    const improved = data.choices?.[0]?.message?.content || description

    return NextResponse.json({ data: { improved } })
  } catch (err) {
    console.error("AI improve error:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

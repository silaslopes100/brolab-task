import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY_NAO_CONFIGURADA" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Melhore e profissionalize a descrição desta tarefa técnica, deixando-a mais clara e objetiva em português.\n\n${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const enhanced = await response.text();

    return NextResponse.json({ enhanced });
  } catch (err: unknown) {
    console.error("Gemini enhancement error:", err);
    const message = err instanceof Error ? err.message : "ERRO_DESCONHECIDO";
    if (message.includes("API_KEY") || message.includes("apiKey") || message.includes("403") || message.includes("PERMISSION")) {
      return NextResponse.json({ error: "ERRO: API_KEY_INVALIDA_OU_SEM_PERMISSAO" }, { status: 403 });
    }
    if (message.includes("404") || message.includes("not found") || message.includes("model")) {
      return NextResponse.json({ error: "ERRO: MODELO_NAO_ENCONTRADO" }, { status: 404 });
    }
    return NextResponse.json({ error: "ERRO: FALHA_NO_ENHANCE_AI" }, { status: 500 });
  }
}

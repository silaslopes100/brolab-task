import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const UpdateLabelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser hex ex: #ff4444").optional(),
})

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ labelId: string }> }) {
  try {
    const { labelId } = await params
    const supabase = createAdminClient() ?? (await createClient())
    const { error } = await supabase.from("labels").delete().eq("id", labelId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting label:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_DELETAR_ETIQUETA" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ labelId: string }> }) {
  try {
    const { labelId } = await params
    const body = await request.json()
    const parsed = UpdateLabelSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const updates: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) updates.name = parsed.data.name.toUpperCase()
    if (parsed.data.color !== undefined) updates.color = parsed.data.color
    const supabase = createAdminClient() ?? (await createClient())
    const { data, error } = await supabase
      .from("labels")
      .update(updates)
      .eq("id", labelId)
      .select()
      .single()
    if (error) {
      if (String(error.code).startsWith("23")) {
        return NextResponse.json({ error: "ERRO: ETIQUETA_JA_EXISTE" }, { status: 409 })
      }
      throw error
    }
    return NextResponse.json({ label: data })
  } catch (err) {
    console.error("Error updating label:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_ATUALIZAR_ETIQUETA" }, { status: 500 })
  }
}

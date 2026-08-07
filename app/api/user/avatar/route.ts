import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

const BUCKET_NAME = "avatars"
const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"])
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png"])

function detectImageType(buffer: Uint8Array): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg"
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return "image/png"
  }
  return null
}

function extForType(type: string): string {
  return type === "image/png" ? "png" : "jpg"
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const userId = formData.get("userId") as string | null
    const file = formData.get("file") as File | null

    if (!userId || !file) {
      return NextResponse.json(
        { error: "ERRO: USER_ID_E_ARQUIVO_OBRIGATORIOS" },
        { status: 400 },
      )
    }

    if (file.size === 0 || file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "ERRO: ARQUIVO_DEVE_TER_NO_MAXIMO_2MB" },
        { status: 400 },
      )
    }

    const declaredType = (file.type || "").toLowerCase()
    if (!ALLOWED_TYPES.has(declaredType)) {
      return NextResponse.json(
        { error: "ERRO: TIPO_INVALIDO_SOMENTE_JPEG_OU_PNG" },
        { status: 400 },
      )
    }

    const fileExt = (file.name.split(".").pop() || "").toLowerCase()
    if (!ALLOWED_EXT.has(fileExt)) {
      return NextResponse.json(
        { error: "ERRO: EXTENSAO_INVALIDA_SOMENTE_JPEG_OU_PNG" },
        { status: 400 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const magicType = detectImageType(buffer)
    if (!magicType || magicType !== declaredType) {
      return NextResponse.json(
        { error: "ERRO: ARQUIVO_NAO_E_UMA_IMAGEM_VALIDA" },
        { status: 400 },
      )
    }

    const { data: bucket, error: bucketError } = await supabase.storage.getBucket(BUCKET_NAME)
    if (bucketError || !bucket) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
      })
      if (createError) throw createError
    }

    const fileName = `avatars/${userId}/${crypto.randomUUID()}.${extForType(magicType)}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: magicType,
        upsert: false,
      })
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)
    const publicUrl = urlData?.publicUrl || ""

    // Remove o avatar antigo (apenas arquivos deste bucket)
    const { data: prev } = await supabase
      .from("team_members")
      .select("avatar_url")
      .eq("id", userId)
      .single()
    const prevUrl: string | null = prev?.avatar_url || null
    if (prevUrl) {
      const marker = `/storage/v1/object/public/${BUCKET_NAME}/`
      const idx = prevUrl.indexOf(marker)
      if (idx !== -1) {
        const prevPath = prevUrl.slice(idx + marker.length)
        await supabase.storage.from(BUCKET_NAME).remove([prevPath])
      }
    }

    const { error: updateError } = await supabase
      .from("team_members")
      .update({ avatar_url: publicUrl })
      .eq("id", userId)
    if (updateError) throw updateError

    return NextResponse.json({ user: { id: userId, avatarUrl: publicUrl } })
  } catch (err) {
    console.error("Error uploading avatar:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_ENVIAR_AVATAR" },
      { status: 500 },
    )
  }
}

import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

const BUCKET_NAME = "covers"
const MAX_SIZE = 5 * 1024 * 1024
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

async function removeStoredCover(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  url: string,
) {
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`
  const idx = url.indexOf(marker)
  if (idx !== -1) {
    const path = url.slice(idx + marker.length)
    await supabase.storage.from(BUCKET_NAME).remove([path])
  }
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
    const taskId = formData.get("taskId") as string | null
    const file = formData.get("file") as File | null

    if (!taskId || !file) {
      return NextResponse.json(
        { error: "ERRO: TASK_ID_E_ARQUIVO_OBRIGATORIOS" },
        { status: 400 },
      )
    }

    if (file.size === 0 || file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "ERRO: ARQUIVO_DEVE_TER_NO_MAXIMO_5MB" },
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

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, cover_image_url")
      .eq("id", taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: "ERRO: TAREFA_NAO_ENCONTRADA" },
        { status: 404 },
      )
    }

    const { data: bucket, error: bucketError } = await supabase.storage.getBucket(BUCKET_NAME)
    if (bucketError || !bucket) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
      })
      if (createError) throw createError
    }

    const fileName = `covers/${taskId}/${crypto.randomUUID()}.${extForType(magicType)}`

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

    // Remove a capa antiga (apenas arquivos deste bucket)
    if (task.cover_image_url) {
      await removeStoredCover(supabase, task.cover_image_url)
    }

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ cover_image_url: publicUrl })
      .eq("id", taskId)
    if (updateError) throw updateError

    return NextResponse.json({ coverImageUrl: publicUrl })
  } catch (err) {
    console.error("Error uploading cover:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_ENVIAR_CAPA" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const { data: task } = await supabase
      .from("tasks")
      .select("cover_image_url")
      .eq("id", taskId)
      .single()

    if (task?.cover_image_url) {
      await removeStoredCover(supabase, task.cover_image_url)
    }

    const { error } = await supabase
      .from("tasks")
      .update({ cover_image_url: null })
      .eq("id", taskId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error removing cover:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_REMOVER_CAPA" },
      { status: 500 },
    )
  }
}

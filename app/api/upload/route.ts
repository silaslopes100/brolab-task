import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

const BUCKET_NAME = "task-files"

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
    const file = formData.get("file") as File | null
    const taskId = formData.get("taskId") as string | null

    if (!file || !taskId) {
      return NextResponse.json(
        { error: "ERRO: ARQUIVO_E_TASK_ID_OBRIGATORIOS" },
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

    const fileExt = file.name.split(".").pop()
    const fileName = `${taskId}/${crypto.randomUUID()}.${fileExt}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    const publicUrl = urlData?.publicUrl || ""

    const { data: fileRecord, error: dbError } = await supabase
      .from("task_files")
      .insert({
        task_id: taskId,
        name: file.name,
        size: file.size,
        type: file.type,
        path: fileName,
      })
      .select()
      .single()

    if (dbError) throw dbError

    return NextResponse.json({
      file: {
        id: fileRecord.id,
        name: fileRecord.name,
        size: fileRecord.size,
        type: fileRecord.type,
        url: publicUrl,
        createdAt: fileRecord.created_at,
      },
    })
  } catch (err) {
    console.error("Error uploading file:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_ENVIAR_ARQUIVO" },
      { status: 500 },
    )
  }
}

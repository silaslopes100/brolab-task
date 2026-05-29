import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

const BUCKET_NAME = "task-files"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json(
        { error: "ERRO: TASK_ID_OBRIGATORIO" },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const { data: files, error } = await supabase
      .from("task_files")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true })

    if (error) throw error

    const formattedFiles = (files || []).map((f) => {
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(f.path)
      return {
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
        url: urlData?.publicUrl || "",
        createdAt: f.created_at,
      }
    })

    return NextResponse.json({ files: formattedFiles })
  } catch (err) {
    console.error("Error fetching files:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_BUSCAR_ARQUIVOS" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get("id")

    if (!fileId) {
      return NextResponse.json(
        { error: "ERRO: ID_DO_ARQUIVO_OBRIGATORIO" },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" },
        { status: 500 },
      )
    }

    const { data: fileRecord, error: fetchError } = await supabase
      .from("task_files")
      .select("path")
      .eq("id", fileId)
      .single()

    if (fetchError || !fileRecord) {
      return NextResponse.json(
        { error: "ERRO: ARQUIVO_NAO_ENCONTRADO" },
        { status: 404 },
      )
    }

    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileRecord.path])

    if (storageError) throw storageError

    const { error: dbError } = await supabase
      .from("task_files")
      .delete()
      .eq("id", fileId)

    if (dbError) throw dbError

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting file:", err)
    return NextResponse.json(
      { error: "ERRO: FALHA_AO_DELETAR_ARQUIVO" },
      { status: 500 },
    )
  }
}

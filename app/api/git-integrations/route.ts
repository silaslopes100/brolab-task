import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import { DEFAULT_WORKSPACE_ID } from "@/lib/labels"

function sanitize(integration: any) {
  return {
    id: integration.id,
    provider: integration.provider,
    repositoryFullName: integration.repository_full_name,
    tokenConfigured: !!integration.access_token,
    createdAt: integration.created_at,
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }, { status: 500 })
    }
    const { data, error } = await supabase
      .from("git_integrations")
      .select("id, provider, repository_full_name, access_token, created_at")
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .order("created_at", { ascending: true })
    if (error) throw error

    return NextResponse.json({ integrations: (data || []).map(sanitize) })
  } catch (err) {
    console.error("Error listing git integrations:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_BUSCAR_INTEGRACOES" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const provider = String(body.provider || "github").toLowerCase()
    const repositoryFullName = String(body.repositoryFullName || body.repository_full_name || "").trim()
    const accessToken = body.accessToken ? String(body.accessToken).trim() : null

    if (!repositoryFullName || !/^[\w.-]+\/[\w.-]+$/.test(repositoryFullName)) {
      return NextResponse.json({ error: "ERRO: REPOSITORIO_INVALIDO (formato: owner/repo)" }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }, { status: 500 })
    }

    const existing = await supabase
      .from("git_integrations")
      .select("id, access_token")
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
      .eq("provider", provider)
      .eq("repository_full_name", repositoryFullName)
      .maybeSingle()

    if (existing.data) {
      const updates: Record<string, unknown> = {}
      if (accessToken) updates.access_token = accessToken
      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ integration: sanitize(existing.data) })
      }
      const { data, error } = await supabase
        .from("git_integrations")
        .update(updates)
        .eq("id", existing.data.id)
        .select()
        .single()
      if (error) throw error
      return NextResponse.json({ integration: sanitize(data) })
    }

    const { data, error } = await supabase
      .from("git_integrations")
      .insert({
        workspace_id: DEFAULT_WORKSPACE_ID,
        provider,
        repository_full_name: repositoryFullName,
        access_token: accessToken,
      })
      .select()
      .single()
    if (error) throw error

    return NextResponse.json({ integration: sanitize(data) })
  } catch (err) {
    console.error("Error saving git integration:", err)
    return NextResponse.json({ error: "ERRO: FALHA_AO_SALVAR_INTEGRACAO" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "ERRO: SUPABASE_SERVICE_ROLE_KEY_NAO_CONFIGURADA" }, { status: 500 })
    }

    const { error } = await supabase
      .from("git_integrations")
      .delete()
      .eq("id", id)
      .eq("workspace_id", DEFAULT_WORKSPACE_ID)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "ERRO: FALHA_AO_REMOVER_INTEGRACAO" }, { status: 500 })
  }
}

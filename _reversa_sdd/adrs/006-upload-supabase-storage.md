# ADR-006 — Upload de Arquivos via Supabase Storage (S3)

> Status: ACEITO | Data: 2026-05-28 | Confiança: 🟢 CONFIRMADO

---

## Contexto

Tasks precisam suportar anexos de arquivos (imagens, PDFs, documentos). Era necessário decidir onde e como armazenar esses arquivos.

Evidências:
- Commit `33155a4 feat: adicionar upload de arquivos para tasks via Supabase Storage S3` (2026-05-28)
- `app/api/upload/route.ts`: bucket `task-files`, paths `{taskId}/{uuid}.{ext}`
- `supabase/migrations/001_create_task_files.sql`: tabela de metadados `task_files`
- Autocriação do bucket na primeira chamada: `supabase.storage.createBucket("task-files", { public: true })`

## Decisão

Usar Supabase Storage (compatível com S3) para armazenamento de arquivos, com:
- Bucket público `task-files` para URLs de acesso direto sem autenticação
- Path `{taskId}/{uuid}.{ext}` para isolamento por task e nomes únicos
- Tabela `task_files` para metadados (nome original, tamanho, tipo MIME, path)
- Bucket criado automaticamente na primeira chamada ao endpoint de upload

## Alternativas consideradas

| Alternativa | Razão de descarte |
|-------------|------------------|
| S3 AWS direto | Requer configuração separada de conta AWS e credenciais adicionais |
| Vercel Blob Storage | Dependência adicional além de Supabase já em uso |
| Armazenar em banco (base64) | Impacto severo em performance para arquivos binários |
| Cloudinary/Uploadthing | Serviços de terceiros adicionais com pricing separado |

## Consequências

**Positivas:**
- Infraestrutura centralizada no Supabase (sem serviços adicionais)
- URLs públicas geradas via `getPublicUrl()` sem expiração
- Path UUID garante unicidade — sem colisão de nomes
- Bucket autocreation simplifica o setup inicial

**Negativas:**
- 🟡 Bucket público — qualquer pessoa com a URL pode acessar os arquivos sem autenticação
- 🟡 `window.location.reload()` após upload (não `fetchData`) — UX desnecessariamente pesada
- 🟡 Sem validação de tipo/tamanho de arquivo no endpoint
- 🟡 Sem cleanup de arquivos no Storage quando task é deletada (apenas `task_files` é removido via CASCADE; o arquivo físico persiste no bucket)

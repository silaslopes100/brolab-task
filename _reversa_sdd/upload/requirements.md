# Upload

> `requirements.md` | Módulo: `upload` | granularity: hybrid
> Fonte: `app/api/upload/route.ts` | doc_level: detalhado

---

## Visão Geral

Módulo responsável por receber arquivos via multipart/form-data, fazer upload para o Supabase Storage e registrar metadados na tabela `task_files`. Auto-cria o bucket `task-files` se não existir. 🟢

---

## Responsabilidades

- Receber arquivo e `taskId` via multipart 🟢
- Auto-criar bucket público `task-files` se ausente 🟢
- Gerar path único com `crypto.randomUUID()` 🟢
- Fazer upload do buffer para o Storage 🟢
- Inserir metadados em `task_files` 🟢
- Retornar URL pública do arquivo criado 🟢

---

## Regras de Negócio

- RN-01: `file` e `taskId` são obrigatórios — HTTP 400 se ausentes 🟢
- RN-02: Path no Storage = `${taskId}/${crypto.randomUUID()}.${fileExt}` 🟢
- RN-03: `upsert: false` — nunca sobrescreve arquivo existente 🟢
- RN-04: Bucket é criado com `{ public: true }` se não existir 🟢
- RN-05: URL pública gerada via `storage.getPublicUrl(fileName)` 🟢

---

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|------------|-------------------|
| RF-01 | POST multipart com `file` + `taskId` → arquivo no Storage + registro no banco | Must | `POST /api/upload` multipart → `{ file: {...} }` |
| RF-02 | POST sem `file` ou `taskId` → HTTP 400 | Must | Campos ausentes → 400 |
| RF-03 | Auto-criar bucket se ausente | Should | Bucket inexistente → criado como público |
| RF-04 | `upsert: false` — sem sobrescrever arquivos | Must | Colisão de path impossível por UUID |

---

## Critérios de Aceite

```gherkin
# Cenário 1 — Upload bem-sucedido
Dado formData com file=relatorio.pdf e taskId=uuid-task
Quando POST /api/upload
Então arquivo em "uuid-task/{uuid}.pdf" no bucket task-files
E registro em task_files com name, size, type, path, task_id
E HTTP 200 { file: { id, name, size, type, url, createdAt } }

# Cenário 2 — Campos ausentes
Quando POST /api/upload sem file ou sem taskId
Então HTTP 400 { error: "ERRO: ARQUIVO_E_TASK_ID_OBRIGATORIOS" }
```

---

## Rastreabilidade

| Arquivo | Função / Bloco | Cobertura |
|---------|---------------|-----------|
| `app/api/upload/route.ts` | `POST` handler completo | 🟢 |

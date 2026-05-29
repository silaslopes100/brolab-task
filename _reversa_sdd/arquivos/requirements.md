# Arquivos

> `requirements.md` | Módulo: `arquivos` | granularity: hybrid
> Fonte: `app/api/files/route.ts` | doc_level: detalhado

---

## Visão Geral

Módulo de gestão de arquivos anexados a tarefas. Permite listar arquivos de uma task específica (GET) e remover um arquivo existente (DELETE). O DELETE é uma operação de **duas fases**: primeiro remove o arquivo do Supabase Storage e depois remove o registro da tabela `task_files`. O upload é tratado por um módulo separado (`/api/upload`). 🟢

---

## Responsabilidades

- Listar arquivos de uma tarefa por `taskId` 🟢
- Remover arquivo do Storage + registro do banco em sequência 🟢
- Resolver URL pública de cada arquivo via `getPublicUrl()` 🟢

---

## Regras de Negócio

- RN-01: GET filtra por `taskId` (query string obrigatória) — sem `taskId` retorna HTTP 400 🟢
- RN-02: DELETE fase 1: `storage.remove([path])` → fase 2: `DELETE FROM task_files WHERE id = fileId` 🟢
- RN-03: DELETE retorna HTTP 404 se `fileId` não encontrado no banco 🟢
- RN-04: DELETE falha na fase 1 (Storage) aborta antes de deletar o registro do banco 🟢
- RN-05: `file.url` é gerado via `getPublicUrl(path)` no momento da leitura 🟢
- RN-06: Sem PATCH — arquivos não são atualizáveis 🟢

---

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|------------|-------------------|
| RF-01 | GET retorna arquivos da task ordenados por `created_at ASC` | Must | `GET /api/files?taskId=uuid` retorna `{ files: [...] }` |
| RF-02 | GET retorna HTTP 400 se `taskId` ausente | Must | `GET /api/files` (sem param) → 400 |
| RF-03 | DELETE remove arquivo do Storage antes de deletar do banco | Must | Sequência: `storage.remove` → `table.delete` |
| RF-04 | DELETE retorna HTTP 404 se arquivo não encontrado | Must | DELETE com id inexistente → 404 |
| RF-05 | DELETE retorna HTTP 400 se `id` ausente | Must | `DELETE /api/files` sem `?id` → 400 |

---

## Critérios de Aceite

```gherkin
# Cenário 1 — Listar arquivos
Quando GET /api/files?taskId=uuid-task
Então HTTP 200 com { files: [...] } ordenados por data

# Cenário 2 — Listar sem taskId
Quando GET /api/files
Então HTTP 400 { error: "ERRO: TASK_ID_OBRIGATORIO" }

# Cenário 3 — Deletar arquivo
Dado arquivo com id="file-uuid" e path="taskId/uuid.pdf"
Quando DELETE /api/files?id=file-uuid
Então storage.remove(["taskId/uuid.pdf"]) executado
E task_files DELETE WHERE id="file-uuid" executado
E HTTP 200 { success: true }

# Cenário 4 — Deletar arquivo inexistente
Quando DELETE /api/files?id=uuid-inexistente
Então HTTP 404 { error: "ERRO: ARQUIVO_NAO_ENCONTRADO" }

# Cenário 5 — DELETE sem id
Quando DELETE /api/files
Então HTTP 400 { error: "ERRO: ID_DO_ARQUIVO_OBRIGATORIO" }
```

---

## Rastreabilidade de Código

| Arquivo | Função / Bloco | Cobertura |
|---------|---------------|-----------|
| `app/api/files/route.ts` | `GET`, `DELETE` handlers | 🟢 |
| `app/api/files/route.ts` | `storage.remove()` | 🟢 |
| `app/api/files/route.ts` | `getPublicUrl()` | 🟢 |

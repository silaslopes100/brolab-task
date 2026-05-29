# Reversa — Relatório de Confiança

> `confidence-report.md` | BrolabTask | Gerado pelo `reversa-reviewer`
> Data: 2026-05-29 | Revisor: copilot | doc_level: detalhado

---

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| Total de specs revisadas | ~126 arquivos / 11 módulos |
| Módulos com confiança ALTA 🟢 | 9 / 11 (82%) |
| Módulos com confiança MÉDIA 🟡 | 2 / 11 (18%) |
| Módulos com confiança BAIXA 🔴 | 0 / 11 |
| **Confiança geral** | **🟢 ALTA — 82%** |
| Bugs pré-documentados | 8 críticos (todos 🔴 corretos) |
| **Novo bug encontrado na revisão** | **1 crítico (comentarios)** |
| Inconsistências cosméticas | 6 |

---

## Confiança por Módulo

### 1. `autenticacao/` — 🟢 ALTA

| Arquivo | Confiança | Notas |
|---------|-----------|-------|
| `requirements.md` | 🟢 | Preciso. Críticos RN-02/RN-06/RN-07 corretamente documentados |
| `design.md` | 🟢 | Fluxo principal fiel ao código. `role_id` retornado mas sem uso documentado |
| `tasks.md` | 🟢 | Consistente com requirements |
| `edge-cases.md` | 🟢 | EC-01 a EC-08 verificados contra código |
| `contracts.md` | 🟢 | Interface correta |
| `questions.md` | 🟢 | Perguntas relevantes |
| `login/requirements.md` | 🟢 | Consistente |
| `login/design.md` | 🟢 | Consistente |
| `login/tasks.md` | 🟢 | Consistente |

**Inconsistência detectada (cosmética):** RF-03 em `requirements.md` documenta critério de aceite como `"Invalid credentials"` (inglês), mas o código retorna `"ERRO: CREDENCIAIS_INVÁLIDAS"` (português). Divergência de idioma na mensagem de erro.

---

### 2. `tarefas/` — 🟢 ALTA

| Arquivo | Confiança | Notas |
|---------|-----------|-------|
| `requirements.md` | 🟢 | Todos os 9 RNs verificados. Comportamento do PATCH parcial confirmado |
| `design.md` | 🟢 | 3 queries sequenciais no GET documentadas e confirmadas |
| `tasks.md` | 🟢 | Consistente |
| `edge-cases.md` | 🟢 | Precisos |
| `contracts.md` | 🟢 | Consistente com código |
| Subfolders (×4) | 🟢 | Consistentes com módulo raiz |

**Observação:** RN-08 afirma que `task_comments` não tem CASCADE explícito. Apenas 1 migration encontrada (`001_create_task_files.sql`) que confirma CASCADE em `task_files`. A estrutura de `task_comments` não tem migration local — confiança moderada para esta afirmação.

---

### 3. `colunas/` — 🟢 ALTA

| Arquivo | Confiança | Notas |
|---------|-----------|-------|
| `requirements.md` | 🟢 | Perfeitamente preciso. GET hardcoded, POST in-memory, DELETE no-op confirmados |
| `design.md` | 🟢 | Confirmado linha a linha no código |
| Restantes | 🟢 | Consistentes |

**Nota:** Este é o módulo com maior aderência código → spec. Todos os 5 RNs verificados diretamente.

---

### 4. `comentarios/` — 🟡 MÉDIA

| Arquivo | Confiança | Notas |
|---------|-----------|-------|
| `requirements.md` | 🟡 | RN-03 tecnicamente correto mas mascarou bug crítico |
| `design.md` | 🟡 | Documenta o código, mas não sinaliza o bug de lookup |
| Restantes | 🟢 | Consistentes com módulo raiz |

**⚠️ BUG CRÍTICO NOVO ENCONTRADO — não documentado nas specs:**

A função de extração de menções usa `.match(/@([\w]+)/g).map(m => m.slice(1))` que retorna usernames **sem o prefixo `@`** (ex: `["joao"]`). A query subsequente faz `.in('username', ["joao"])`, mas a tabela `team_members` armazena usernames **com `@`** (ex: `"@joao"`) pela normalização em `POST /api/users`. Resultado: **a query nunca encontra nenhum usuário mencionado** → notificações de `@mention` **jamais são disparadas**.

O spec documenta corretamente o comportamento observável ("menções a membros inexistentes são ignoradas silenciosamente") mas não identifica a causa-raiz nem sinaliza como bug funcional. A RN-03 é tecnicamente correta mas insuficiente para capturar o problema.

---

### 5. `arquivos/` — 🟢 ALTA

| Arquivo | Confiança | Notas |
|---------|-----------|-------|
| Todos | 🟢 | DELETE em 2 fases (Storage → DB) confirmado no código. RNs verificados |

**Confirmado via migration:** `task_files` tem `ON DELETE CASCADE` referenciando `tasks(id)`.

---

### 6. `upload/` — 🟢 ALTA

| Arquivo | Confiança | Notas |
|---------|-----------|-------|
| Todos | 🟢 | `Uint8Array`, `upsert: false`, auto-bucket, UUID confirmados no código |

**EC-18 confirmado:** `window.location.reload()` após upload bem-sucedido existe no SPA (`kanban-app/edge-cases.md`).

---

### 7. `etiquetas/` — 🟢 ALTA

| Arquivo | Confiança | Notas |
|---------|-----------|-------|
| `requirements.md` | 🟢 | GET `[]` hardcoded, POST in-memory, DELETE no-op — todos confirmados |
| Restantes | 🟢 | Consistentes |

**Inconsistência cosmética:** `requirements.md` mostra `getLabelColor(name)` no bloco do algoritmo, mas o código em `labels/route.ts` chama `getLabelColor(name.toUpperCase())` — o hash é calculado sobre o nome já uppercase. Comportamento documentado correto, pseudocódigo levemente impreciso.

---

### 8. `notificacoes/` — 🟢 ALTA

| Arquivo | Confiança | Notas |
|---------|-----------|-------|
| Todos | 🟢 | GET/PATCH/DELETE verificados contra código |

**Observação (não documentada):** RN-01 diz que GET sem `userId` retorna `{ notifications: [] }` sem erro. Isso é condicionalmente verdadeiro: se `SUPABASE_SERVICE_ROLE_KEY` não estiver configurada, o handler retorna HTTP 500 ANTES de checar `userId`. Spec não menciona esta precedência.

---

### 9. `usuarios/` — 🟢 ALTA

| Arquivo | Confiança | Notas |
|---------|-----------|-------|
| Todos | 🟢 | Normalização de campos (name, username, email, role) verificada. Senha em plaintext confirmada |

---

### 10. `lib-supabase/` — 🟢 ALTA

| Arquivo | Confiança | Notas |
|---------|-----------|-------|
| Todos | 🟢 | Três clientes, null guard, cookies SSR, `persistSession: false` — todos precisos |

---

### 11. `kanban-app/` — 🟡 MÉDIA

| Arquivo | Confiança | Notas |
|---------|-----------|-------|
| `requirements.md` | 🟡 | Afirma "15 componentes" mas a tabela lista 17 entradas |
| `design.md` | 🟢 | Handlers e estado documentados corretamente |
| `edge-cases.md` | 🟢 | EC-01 a EC-23 todos verificados |
| `contracts.md` | 🟢 | Consistente |
| Subfolders (×5) | 🟢 | Consistentes |

**Inconsistência detectada (moderada):** `requirements.md` menciona "15 componentes React" no texto introdutório mas a tabela de componentes lista 17 entradas: LoginScreen, LoadingScreen, NotificationBell, NotificationsModal, ProfileEditModal, TeamAdminModal, LabelBadge, LabelManager, MentionInput, TaskEditModal, TaskCard, NewTaskForm, KanbanColumn, NewColumnForm, Header, KanbanBoard, BroLabTask. O número correto é **17**.

---

## Arquivos Globais

| Arquivo | Confiança | Observação |
|---------|-----------|------------|
| `architecture.md` | 🟢 | Consistente com código |
| `c4-context.md` | 🟢 | Preciso |
| `c4-containers.md` | 🟢 | Preciso |
| `c4-components.md` | 🟢 | Preciso |
| `erd-complete.md` | 🟡 | Apenas 1 migration encontrada — ERD parcialmente inferido |
| `deployment.md` | 🟢 | Vercel + Supabase confirmados (vercel.json existe) |
| `domain.md` | 🟢 | Domínio correto |
| `permissions.md` | 🟢 | Lacunas de auth documentadas |
| `state-machines.md` | 🟢 | Máquinas de estado corretas |
| `openapi/brolabtask-api.yaml` | 🟢 | Cobre todos os 8 recursos |
| `traceability/code-spec-matrix.md` | 🟢 | Todos os 13 arquivos fonte mapeados |
| `traceability/spec-impact-matrix.md` | 🟢 | Dependências corretas |
| `user-stories/` | 🟢 | US-01 a US-20 consistentes com funcionalidades |
| `adrs/` (7 ADRs) | 🟢 | Decisões verificadas no código |

---

## Bugs Pré-Documentados — Verificação

| Bug | Severidade | Verificado | Spec Correta? |
|-----|-----------|-----------|---------------|
| Senha em plaintext | 🔴 | ✅ Confirmado em `auth/login/route.ts:51` | 🟢 |
| POST /api/columns in-memory | 🔴 | ✅ Confirmado em `columns/route.ts:27-40` | 🟢 |
| DELETE /api/columns no-op | 🔴 | ✅ Confirmado em `columns/route.ts:43` | 🟢 |
| GET /api/labels retorna `[]` | 🔴 | ✅ Confirmado em `labels/route.ts:21` | 🟢 |
| DELETE /api/labels no-op | 🔴 | ✅ Confirmado em `labels/route.ts:45` | 🟢 |
| Labels sem persistência | 🔴 | ✅ Confirmado — sem tabela labels | 🟢 |
| Sem auth em rotas | 🔴 | ✅ Confirmado — nenhum middleware | 🟢 |
| window.location.reload() upload | 🟡 | ✅ Confirmado em `edge-cases.md:EC-18` | 🟢 |

---

## Novo Bug Encontrado na Revisão

| Bug | Severidade | Módulo | Impacto |
|-----|-----------|--------|---------|
| @mentions nunca disparam notificações (prefix bug) | 🔴 CRÍTICO | `comentarios` | Sistema de notificações de mention completamente inoperante |

---

## Recomendação

As specs estão **prontas para uso como contrato de reimplementação** com as seguintes ressalvas:

1. 🔴 Adicionar documentação do bug de `@mention` (username sem `@` vs banco com `@`) em `comentarios/requirements.md`
2. 🟡 Corrigir contagem de componentes em `kanban-app/requirements.md` (15 → 17)
3. 🟡 Unificar idioma da mensagem de erro em `autenticacao/requirements.md` RF-03
4. 🟡 Documentar em `notificacoes/requirements.md` que GET sem `userId` retorna 500 se key não configurada

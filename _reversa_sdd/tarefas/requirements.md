# Tarefas

> `requirements.md` | Módulo: `tarefas` | granularity: hybrid
> Fonte: `app/api/tasks/route.ts` | doc_level: detalhado

---

## Visão Geral

Módulo central da aplicação. Gerencia o ciclo de vida completo das tarefas no board Kanban: listagem com dados agregados, criação, atualização (incluindo movimentação entre colunas) e exclusão. Tarefas são a entidade principal do sistema. 🟢

---

## Responsabilidades

- Listar todas as tarefas com comentários e arquivos agregados em uma única resposta 🟢
- Criar uma nova tarefa numa coluna/posição específica 🟢
- Atualizar parcialmente uma tarefa existente (título, descrição, coluna, posição, assignees, labels) 🟢
- Deletar uma tarefa por ID 🟢
- Calcular a cor de cada label via algoritmo de hash determinístico 🟢
- Gerar a URL pública de cada arquivo anexado 🟢

---

## Regras de Negócio

- RN-01: `tasks.status` armazena o nome da coluna (ex: `"BACKLOG"`) — funciona como `columnId` 🟢
- RN-02: `tasks.labels` é `TEXT[]` — nomes das labels sem referência a uma tabela de labels 🟢
- RN-03: `tasks.assignees` é `TEXT[]` — nomes dos membros sem referência a `team_members.id` 🟢
- RN-04: A cor de cada label é computada no momento do retorno via `getLabelColor(name)` — não é persistida 🟢
- RN-05: O GET retorna **todas** as tarefas de todas as colunas em uma única chamada; o SPA distribui por coluna no cliente 🟢
- RN-06: O PATCH é parcial — apenas campos presentes no body são atualizados 🟢
- RN-07: O DELETE recebe o `id` via query string (`?id=uuid`) 🟢
- RN-08: Deletar uma tarefa cascateia para `task_files` (FK CASCADE) — comentários não têm CASCADE explícito 🟡
- RN-09: `getLabelColor` usa hash djb2-like: `hash = charCodeAt(i) + ((hash << 5) - hash)` → índice no array de 7 cores 🟢

---

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|------------|-------------------|
| RF-01 | GET retorna todas as tarefas ordenadas por `position ASC` com comentários e arquivos agregados | Must | Resposta contém `{ tasks: Task[] }` com `comments[]` e `files[]` por task |
| RF-02 | Cada task no GET inclui labels com `{ id, name, color }` onde `color` é calculado por hash | Must | Labels retornam com `color` hexadecimal válido |
| RF-03 | POST cria uma task com os campos fornecidos; `columnId` mapeado para `status` | Must | Task criada retorna HTTP 201-like (200) com `{ task }` completo |
| RF-04 | PATCH atualiza apenas os campos presentes no body | Must | PATCH com `{ columnId }` altera apenas `status`, sem tocar outros campos |
| RF-05 | DELETE remove a task pelo `id` na query string | Must | Task deletada → HTTP 200 `{ success: true }` |
| RF-06 | GET fallback: usa `createClient()` (SSR) se `createAdminClient()` retornar null | Should | Funciona sem `SUPABASE_SERVICE_ROLE_KEY` usando anon key |

---

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Performance | GET faz 3 queries sequenciais ao banco + N chamadas `getPublicUrl()` (1 por arquivo) | `app/api/tasks/route.ts:27-82` | 🟢 |
| Escalabilidade | Sem paginação — retorna 100% das tasks em cada GET | Ausência de `range()` ou `limit()` | 🟢 (lacuna) |
| Segurança | Sem validação de autorização — qualquer requisição pode criar/deletar tasks | Ausência de auth middleware | 🟢 (lacuna) |

---

## Critérios de Aceitação

```gherkin
# Cenário 1 — Listar tarefas
Dado que existem tasks no banco com comentários e arquivos
Quando GET /api/tasks
Então resposta HTTP 200 com { tasks: [...] }
E cada task contém comments[] e files[] aninhados
E cada label contém id, name e color

# Cenário 2 — Criar task
Dado um board com coluna "FAZENDO"
Quando POST /api/tasks com { title: "Nova task", columnId: "FAZENDO", position: 0 }
Então resposta HTTP 200 com { task: { id, title, columnId: "FAZENDO", ... } }

# Cenário 3 — Mover task entre colunas
Dado uma task existente com columnId "BACKLOG"
Quando PATCH /api/tasks com { id, columnId: "FAZENDO" }
Então resposta HTTP 200 com { success: true }
E tasks.status = "FAZENDO" no banco

# Cenário 4 — Deletar task
Dado uma task com id "uuid-123"
Quando DELETE /api/tasks?id=uuid-123
Então resposta HTTP 200 com { success: true }
E task_files associados deletados em cascade

# Cenário 5 — DELETE sem id
Quando DELETE /api/tasks sem query string
Então resposta HTTP 400 com { error: "ID obrigatório" }
```

---

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| GET com agregação | Must | Chamado no boot e após cada ação |
| POST criar task | Must | Fluxo core do Kanban |
| PATCH mover/editar task | Must | Principal interação do usuário |
| DELETE task | Must | Funcionalidade básica do board |
| Paginação do GET | Won't | Não implementado |
| Autorização nas rotas | Won't | Não implementado |

---

## Rastreabilidade de Código

| Arquivo | Função / Bloco | Cobertura |
|---------|---------------|-----------|
| `app/api/tasks/route.ts` | `GET`, `POST`, `PATCH`, `DELETE` | 🟢 |
| `app/api/tasks/route.ts` | `getLabelColor()` | 🟢 |
| `app/page.tsx` | `fetchData()` | 🟢 |
| `app/page.tsx` | `handleMoveTask()`, `handleDeleteTask()` | 🟢 |

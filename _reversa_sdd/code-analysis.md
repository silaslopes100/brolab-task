# Análise de Código — BrolabTask

> Gerado pelo Archaeologist em: 2026-05-29 | doc_level: detalhado

---

## Visão Geral do Sistema

**BrolabTask** é um gerenciador de tarefas estilo Kanban com tema terminal hacker (fundo preto, texto verde `#00FF66`, fonte JetBrains Mono). Toda a aplicação é uma SPA Next.js com ~1960 linhas em um único arquivo (`app/page.tsx`), comunicando-se via API Routes do próprio Next.js que fazem chamadas ao Supabase.

### Arquitetura Macro

```
Browser (React SPA)
    ↕ fetch() REST
Next.js API Routes (app/api/**/route.ts)
    ↕ @supabase/supabase-js (service_role)
Supabase PostgreSQL + Storage
```

---

## Módulo: `auth`

**Caminho:** `app/api/auth/login/route.ts`
**Responsabilidade:** Autenticação customizada por email ou @username contra a tabela `team_members`.

### Funções

#### `POST /api/auth/login`
- **Entrada:** `{ email: string, password: string }`
- **Fluxo:** Normaliza o identificador → tenta busca por email → se não encontrar, tenta por @username → compara senha em plaintext → retorna objeto de usuário
- **Saída:** `{ user: { id, name, username, email, role, role_id, isAdmin } }` ou erro 401/500

### Algoritmos
- **Normalização de username:** `loginIdentifier.startsWith("@") ? loginIdentifier : "@" + loginIdentifier.replace(/^@/, "")` — garante sempre o prefixo `@`
- **Determinação de isAdmin:** `role === "ADMIN_TOTAL" || role === "ADMIN"` 🟢

### Regras de Negócio
- 🔴 **LACUNA — CRÍTICO:** Senha comparada em plaintext (`user.password !== password`). Nenhum hash (bcrypt/argon2) detectado.
- 🟢 Login aceita email OU @username (dois caminhos distintos de busca)
- 🟢 Identificador normalizado para lowercase antes da busca
- 🟡 Sem limitação de tentativas (sem rate limiting, sem lockout)
- 🟡 Sem expiração de sessão (estado de autenticação gerenciado apenas por React state — sem cookie/JWT)

### Dependências
- `lib/supabase/admin.ts` → `createAdminClient()`
- Tabela: `team_members`

---

## Módulo: `tasks`

**Caminho:** `app/api/tasks/route.ts`
**Responsabilidade:** CRUD completo de tarefas com agregação de comentários e arquivos.

### Funções

#### `getLabelColor(name: string): string`
- Algoritmo determinístico de atribuição de cor via hash da string
- Paleta: `["#FFFFFF", "#6B7280", "#84CC16", "#A3E635", "#F97316", "#EF4444", "#22C55E"]`
- Fórmula: `hash = charCode + ((hash << 5) - hash)` → `LABEL_COLORS[Math.abs(hash) % 7]`
- 🟢 Produz sempre a mesma cor para o mesmo nome de label

#### `GET /api/tasks`
- Faz **3 queries sequenciais**: tasks → task_comments → task_files
- Agrupa comentários e arquivos por `task_id` em memória (dois `Record<string, []>`)
- Mapeia `task.status` → `columnId` (a coluna é o campo `status` no banco)
- Gera URLs públicas de arquivos via `supabase.storage.getPublicUrl(path)`
- Labels retornadas com cor calculada via `getLabelColor`

#### `POST /api/tasks`
- **Entrada:** `{ title, description, columnId, position, assignees, labels }`
- Labels gravadas como `TEXT[]` (apenas o `name` de cada label, sem cor — cor é calculada no momento da leitura)
- `columnId` mapeado para o campo `status` no banco

#### `PATCH /api/tasks`
- Atualização parcial: apenas campos não-`undefined` são incluídos no UPDATE
- `columnId` mapeado para `status` no UPDATE

#### `DELETE /api/tasks`
- Recebe `id` via query param (`?id=`)
- Exclusão em cascata via FK: `task_files` tem `ON DELETE CASCADE` referenciando `tasks`

### Constantes de Negócio
```typescript
const LABEL_COLORS = ["#FFFFFF","#6B7280","#84CC16","#A3E635","#F97316","#EF4444","#22C55E"]
```

### Dependências
- `lib/supabase/admin.ts` + `lib/supabase/server.ts`
- Tabelas: `tasks`, `task_comments`, `task_files`
- Storage: bucket `task-files`

---

## Módulo: `columns`

**Caminho:** `app/api/columns/route.ts`
**Responsabilidade:** Gerenciamento de colunas do Kanban — **totalmente estático em memória**.

### Algoritmo / Regra crítica
- 🔴 **LACUNA:** Colunas **não são persistidas** em banco de dados. São hardcoded no array `DEFAULT_COLUMNS`
- 🟢 `GET` retorna as 5 colunas padrão: `BACKLOG`, `FAZENDO`, `ALTERAÇÕES`, `APROVADO`, `FEITO`
- 🟡 `POST` simula criação retornando um objeto coluna, mas não persiste nada
- 🟡 `DELETE` é no-op (retorna `{ success: true }` sem fazer nada)
- Qualquer coluna "criada" pelo usuário existe apenas até o próximo reload da página

### Constante
```typescript
const DEFAULT_COLUMNS = ["BACKLOG","FAZENDO","ALTERAÇÕES","APROVADO","FEITO"]
```

---

## Módulo: `comments`

**Caminho:** `app/api/comments/route.ts`
**Responsabilidade:** Criação de comentários com disparo automático de notificações por @menção.

### Funções

#### `POST /api/comments`
- **Entrada:** `{ taskId, authorUsername, content }`
- **Fluxo:**
  1. Extrai @menções do content via regex `/@([\w]+)/g`
  2. Se há menções: busca IDs dos usuários mencionados em `team_members`
  3. Busca título da tarefa em `tasks`
  4. Insere notificações para cada usuário mencionado
  5. Insere o comentário em `task_comments`

### Algoritmo: @mention parsing
```typescript
const mentions = (content.match(/@([\w]+)/g) || []).map((m) => m.slice(1))
```
- Extrai tokens após `@` (apenas `\w` — letras, números, underscore)
- Compara contra `team_members.username` diretamente

### Algoritmo: notification dispatch
- Para cada menção → busca usuário por username → insere em `notifications` com:
  - `type: 'mention'`
  - `message: "${authorUsername} mencionou você na tarefa "${taskTitle}"`
  - `task_id, task_title, from_user, read: false`

### Dependências
- `lib/supabase/admin.ts`
- Tabelas: `task_comments`, `team_members`, `tasks`, `notifications`

---

## Módulo: `files`

**Caminho:** `app/api/files/route.ts`
**Responsabilidade:** Listagem e exclusão de arquivos vinculados a tarefas.

### Funções

#### `GET /api/files?taskId=<id>`
- Valida presença de `taskId` (400 se ausente)
- Busca `task_files` filtrado por `task_id`
- Gera `publicUrl` para cada arquivo via Supabase Storage

#### `DELETE /api/files?id=<fileId>`
- **Two-phase delete:**
  1. Busca `path` do arquivo em `task_files`
  2. Remove do Supabase Storage (`storage.remove([path])`)
  3. Remove registro em `task_files`
- 🟡 Ordem importa: se storage falhar, DB não é excluído (eventual consistency)

### Dependências
- `lib/supabase/admin.ts`
- Tabelas: `task_files`
- Storage: bucket `task-files`

---

## Módulo: `upload`

**Caminho:** `app/api/upload/route.ts`
**Responsabilidade:** Upload de arquivos para Supabase Storage e registro em banco.

### Funções

#### `POST /api/upload` (multipart/form-data)
- **Entrada:** FormData com `file` (File) e `taskId` (string)
- **Fluxo:**
  1. Verifica existência do bucket `task-files` — cria se não existir (`public: true`)
  2. Gera nome único: `${taskId}/${crypto.randomUUID()}.${fileExt}`
  3. Converte `File` → `ArrayBuffer` → `Uint8Array`
  4. Upload via `storage.upload(fileName, buffer, { contentType, upsert: false })`
  5. Obtém `publicUrl`
  6. Insere registro em `task_files` com metadados

### Algoritmos
- Geração de path: hierárquico por tarefa → `taskId/uuid.ext` (facilita listagem e exclusão em batch)
- `crypto.randomUUID()` garante unicidade sem colisão

### Dependências
- `lib/supabase/admin.ts`
- Tabelas: `task_files`
- Storage: bucket `task-files` (auto-criado se ausente)

---

## Módulo: `labels`

**Caminho:** `app/api/labels/route.ts`
**Responsabilidade:** Labels de tarefa — gerenciamento **em memória, sem persistência própria**.

### Algoritmos
- Mesma lógica `getLabelColor` duplicada do módulo `tasks` (código duplicado) 🟡
- `GET` retorna array vazio
- `POST` gera label com `id = name.toUpperCase()` e cor determinística
- `DELETE` no-op

### Regras de Negócio
- 🔴 **LACUNA:** Labels não têm tabela própria. São armazenadas como `TEXT[]` em `tasks.labels`
- 🟡 A entidade `Label` existe apenas como projeção calculada (name + cor derivada do hash)
- 🟡 `getLabelColor` duplicado em `tasks/route.ts` e `labels/route.ts` — potencial inconsistência

---

## Módulo: `notifications`

**Caminho:** `app/api/notifications/route.ts`
**Responsabilidade:** Notificações de @menção persistidas por usuário.

### Funções

#### `GET /api/notifications?userId=<id>`
- Retorna lista vazia se `userId` ausente (graceful degradation)
- Ordenado por `created_at DESC`

#### `PATCH /api/notifications`
- Marca uma notificação como lida/não-lida (`{ id, isRead }`)

#### `DELETE /api/notifications?userId=<id>`
- Limpa **todas** as notificações do usuário (bulk delete por `user_id`)

### Integração Realtime (frontend)
- Frontend assina canal Supabase Realtime `notifications_user_${userId}`
- Filtro: `postgres_changes → INSERT → user_id=eq.${currentUser.id}`
- Novas notificações aparecem em tempo real sem polling

---

## Módulo: `users`

**Caminho:** `app/api/users/route.ts`
**Responsabilidade:** CRUD de membros da equipe (`team_members`).

### Funções

#### `GET /api/users`
- Retorna todos os membros ordenados por `created_at ASC`
- Campos: `id, email, username, name, role, role_id, created_at`

#### `POST /api/users`
- Normalização: `name.toUpperCase().replace(/\s+/g, "_")`, `username.toLowerCase()` com `@` prefixado, `email.toLowerCase()`, `role.toUpperCase().replace(/\s+/g, "_")`
- Papel padrão: `"COLLABORATOR"` se não informado

### Lacunas
- 🔴 **LACUNA:** Frontend chama `PATCH /api/users` para atualizar perfil, mas o handler `PATCH` **não existe** no `route.ts` — a chamada resultará em 405 Method Not Allowed
- 🔴 **LACUNA:** Frontend chama `DELETE /api/users?id=` para excluir membro, mas handler `DELETE` também **não existe** no arquivo analisado

---

## Módulo: `lib/supabase`

**Caminho:** `lib/supabase/`
**Responsabilidade:** Fábrica de clientes Supabase para diferentes contextos de execução.

### Clientes

#### `admin.ts` → `createAdminClient()`
- Usa `SUPABASE_SERVICE_ROLE_KEY`
- Retorna `null` se a variável não estiver definida (nullable — verificado em cada rota)
- `persistSession: false`, `autoRefreshToken: false` 🟢
- Header customizado: `X-Client-Info: brolab-task-admin`
- **Ignora RLS** (service role bypassa Row Level Security)

#### `server.ts` → `createClient()` (async)
- Usa `@supabase/ssr` → `createServerClient`
- Lê/escreve cookies via `next/headers` para gerenciar sessão SSR
- Suporta dois nomes de variável: `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

#### `client.ts` → `createClient()`
- Usa `@supabase/ssr` → `createBrowserClient`
- Usado no frontend para Realtime subscriptions
- Mesma lógica de fallback de variável do server.ts

---

## Módulo: `kanban-app`

**Caminho:** `app/page.tsx`
**Responsabilidade:** SPA monolítica do Kanban (~1960 LOC, todos os componentes em um único arquivo).

### Componentes React (hierarquia)

```
BroLabTask (componente raiz — gerencia toda a state global)
├── LoadingScreen
├── LoginScreen
└── KanbanBoard
    ├── Header
    │   └── NotificationBell
    ├── NotificationsModal
    ├── TeamAdminModal
    ├── ProfileEditModal
    ├── TaskEditModal
    │   ├── LabelManager
    │   │   └── LabelBadge
    │   └── MentionInput
    └── [n] KanbanColumn
        ├── [n] TaskCard
        │   └── LabelBadge
        └── NewTaskForm
```

### State Management (BroLabTask)
```typescript
currentUser: TeamMember | null
team: TeamMember[]
columns: Column[]  // inclui tasks aninhadas
notifications: Notification[]
isLoading: boolean
loadingMessage: string
```

### Funções de Efeito / Callbacks principais

#### `fetchData` (useCallback)
- Dispara **3 fetches paralelos** via `Promise.all`: `/api/columns`, `/api/tasks`, `/api/users`
- Associa tasks a colunas por `task.columnId === column.id`, ordenadas por `position`

#### `fetchNotifications` (useCallback)
- Fetch de `/api/notifications?userId=` para o usuário atual

#### Realtime subscription (useEffect)
- Cria cliente browser → subscreve canal `notifications_user_${currentUser.id}`
- Evento: `postgres_changes → INSERT` na tabela `notifications`
- Cleanup: `supabase.removeChannel(channel)` no return do effect

#### `handleMoveTask`
- Envia PATCH para `/api/tasks` com `columnId` e `position` novos
- Recarrega dados completos após a operação

### MentionInput — Autocomplete de @menções
- Detecta `@` na posição final do texto ou seguido de caracteres sem espaço
- Filtra `team` por `username` ou `name` contendo o texto após `@`
- Ao selecionar: substitui `@<filter>` → `@username ` (com espaço ao final)

### Regras de UI
- 🟢 Colunas padrão (`DEFAULT_COLUMN_NAMES`) não mostram botão de exclusão
- 🟢 Apenas admins veem botão "DEL" nos membros e podem criar usuários
- 🟡 `window.location.reload()` chamado após upload de arquivo (não atualiza via fetchData)
- 🔴 **LACUNA:** Sem feedback visual de erro em `handleAddTask`, `handleUpdateTask` etc. — erros são apenas `console.error`

---

## Resumo de Complexidade

| Módulo | Complexidade | Algoritmos não-triviais | Lacunas críticas |
|--------|-------------|------------------------|-----------------|
| auth | Média | Login dual (email/username) | Senha em plaintext |
| tasks | Alta | getLabelColor (hash), 3-query aggregation | — |
| columns | Baixa | — | Sem persistência |
| comments | Média | @mention regex + notification dispatch | — |
| files | Baixa | Two-phase delete | — |
| upload | Média | Bucket autocreation, UUID path | — |
| labels | Baixa | getLabelColor (duplicado) | Sem tabela própria |
| notifications | Baixa | — | — |
| users | Baixa | Name/role normalization | PATCH/DELETE ausentes |
| lib/supabase | Baixa | — | — |
| kanban-app | Alta | Realtime sub., MentionInput autocomplete, fetchData parallel | Erros silenciosos |

---

## Alertas de Segurança (OWASP)

| # | Severidade | Descrição | Localização |
|---|-----------|-----------|-------------|
| 1 | 🔴 CRÍTICO | Senha em plaintext na tabela `team_members` (A02: Cryptographic Failures) | `auth/login/route.ts:53` |
| 2 | 🔴 CRÍTICO | Autenticação customizada sem tokens/sessão — logout é apenas `setCurrentUser(null)`, sem invalidação server-side (A07: Auth Failures) | `page.tsx:handleLogout` |
| 3 | 🟡 ALTO | `SUPABASE_SERVICE_ROLE_KEY` exposta em `.env.local` — deve estar apenas em variáveis de servidor (já está sem `NEXT_PUBLIC_` prefix, correto) | `.env.local` |
| 4 | 🟡 ALTO | Sem rate limiting nas rotas de autenticação — brute force possível | `auth/login/route.ts` |
| 5 | 🟡 MÉDIO | `NEXT_PUBLIC_SUPABASE_ANON_KEY` visível no bundle client (esperado para anon key, mas RLS não está configurada) | `.env.local` |

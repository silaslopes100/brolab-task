# Inventário do Projeto — BrolabTask

> Gerado pelo Scout em: 2026-05-29 | Agente: reversa-scout
> Atualizado em: 2026-05-30 — novas features: subtasks, timer, bcrypt, middleware auth, colunas/labels persistidas

---

## 1. Visão Geral

| Atributo | Valor |
|----------|-------|
| **Nome** | BrolabTask (BRO.LABS // BROLABTASK_CLI_v1.0) |
| **Tipo** | Aplicação web — Kanban Board terminal-style |
| **Origem** | Bootstrapped com [v0.app](https://v0.app/chat/projects/prj_JO4BttV6c4cCph45A2begZ7VDqt6) |
| **Deploy** | Vercel (deploy automático a cada merge em `main`) |
| **Linguagem principal** | TypeScript |
| **Framework** | Next.js 16.2.6 (App Router) |
| **Backend** | Supabase (PostgreSQL + Storage + Auth própria via `team_members`) |
| **Estilo** | Tailwind CSS 4.x + shadcn/ui (Radix UI) |
| **Tema visual** | Terminal hacker — fundo preto, texto `#00FF66` (verde terminal), fonte JetBrains Mono |

---

## 2. Estrutura de Diretórios

```
brolab-task/
├── app/                          # Next.js App Router
│   ├── globals.css               # Estilos globais
│   ├── layout.tsx                # Root layout (JetBrains Mono + Analytics)
│   ├── page.tsx                  # Aplicação principal (Kanban monolítico ~2200+ LOC)
│   └── api/                      # API Routes (REST via Next.js Route Handlers)
│       ├── auth/login/route.ts   # POST /api/auth/login (bcrypt + session cookie)
│       ├── columns/route.ts      # GET/POST/DELETE /api/columns (persistido no DB)
│       ├── comments/route.ts     # POST/PATCH/DELETE /api/comments (suporta subtask_id)
│       ├── files/route.ts        # GET/DELETE /api/files
│       ├── labels/route.ts       # GET/POST/DELETE /api/labels (persistido no DB)
│       ├── notifications/route.ts# GET/PATCH/DELETE /api/notifications
│       ├── subtasks/route.ts     # GET/POST/PATCH/DELETE /api/subtasks [NOVO]
│       ├── tasks/route.ts        # GET/POST/PATCH/DELETE /api/tasks (labels c/ cor)
│       ├── timer/route.ts        # POST /api/timer (cronômetro automático) [NOVO]
│       ├── upload/route.ts       # POST /api/upload
│       └── users/route.ts        # GET/POST/PATCH/DELETE /api/users (bcrypt)
│
├── components/
│   ├── theme-provider.tsx        # next-themes provider
│   └── ui/                       # Design system shadcn/ui (57 componentes)
├── hooks/
│   ├── use-mobile.ts             # Hook breakpoint mobile
│   └── use-toast.ts              # Hook toast
├── lib/
│   ├── utils.ts                  # cn() helper (clsx + tailwind-merge)
│   └── supabase/
│       ├── admin.ts              # createAdminClient() — service_role, sem RLS
│       ├── client.ts             # createClient() — browser (anon key)
│       └── server.ts             # createClient() — servidor (cookies SSR)
├── middleware.ts                 # [NOVO] Auth middleware para API Routes
├── public/                       # Assets estáticos
├── scripts/
│   └── dev-server.mjs            # Dev server (Bun)
├── styles/
│   └── globals.css
├── supabase/
│   └── migrations/
│       ├── 001_create_task_files.sql
│       ├── 002_create_subtasks.sql     # [NOVO] Tabela subtasks + subtask_id em comments
│       └── 003_create_columns_and_labels.sql  # [NOVO] Tabelas columns e labels
├── .env.local                    # Supabase keys
├── next.config.mjs
├── package.json                  # Dependências (inclui bcryptjs)
└── vercel.json
```

---

## 3. Módulos Identificados

| Módulo | Caminho | Tipo | Responsabilidade |
|--------|---------|------|-----------------|
| **auth** | `app/api/auth/login/` | API Route | Login por email/@username, bcrypt, sessão via cookie |
| **tasks** | `app/api/tasks/` | API Route | CRUD de tarefas com agregação de subtasks, comments, files |
| **subtasks** | `app/api/subtasks/` | API Route | [NOVO] CRUD de subtarefas com tempo estimado/realizado |
| **timer** | `app/api/timer/` | API Route | [NOVO] Gerencia cronômetro: inicia ao sair de BACKLOG, para em APROVADO |
| **columns** | `app/api/columns/` | API Route | Colunas Kanban — persistidas no banco |
| **comments** | `app/api/comments/` | API Route | CRUD de comentários + @menções + suporte a subtasks |
| **files** | `app/api/files/` | API Route | Listagem e exclusão de arquivos |
| **upload** | `app/api/upload/` | API Route | Upload para Supabase Storage |
| **labels** | `app/api/labels/` | API Route | CRUD de labels persistidas no banco |
| **notifications** | `app/api/notifications/` | API Route | Notificações Realtime |
| **users** | `app/api/users/` | API Route | CRUD de membros (bcrypt, isAdmin calculado) |
| **middleware** | `middleware.ts` | Middleware | [NOVO] Protege POST/PATCH/DELETE nas API Routes |
| **lib/supabase** | `lib/supabase/` | Infra | Clientes Supabase |
| **ui** | `components/ui/` | Design System | 57 componentes shadcn/ui |
| **kanban-app** | `app/page.tsx` | Frontend | SPA: login, board, modais, subtasks, timer, notificações |

---

## 4. Banco de Dados

| Arquivo | Tipo | Conteúdo |
|---------|------|---------|
| `001_create_task_files.sql` | DDL migration | Tabela `task_files` |
| `002_create_subtasks.sql` | DDL migration | [NOVO] Tabela `subtasks` + coluna `subtask_id` em `task_comments` |
| `003_create_columns_and_labels.sql` | DDL migration | [NOVO] Tabelas `columns` (seed 5 colunas) e `labels` |

**Tabelas:**

| Tabela | Colunas | Descrição |
|--------|---------|-----------|
| `tasks` | id, title, description, status, position, assignees[], labels[], created_at | Tarefas Kanban |
| `subtasks` | id, task_id (FK), title, description, estimated_hours, time_spent, status, position, assignees[], timer_started_at, created_at | [NOVO] Subtarefas com controle de horas |
| `task_comments` | id, task_id (FK), subtask_id (FK), author_username, content, created_at | Comentários (agora com suporte a subtasks) |
| `task_files` | id, task_id (FK CASCADE), name, size, type, path, created_at | Metadados de arquivos |
| `team_members` | id, name, username, email, password (bcrypt), role, role_id, created_at | Usuários (agora com bcrypt) |
| `notifications` | id, user_id (FK), type, message, task_id, task_title, from_user, read, created_at | Notificações |
| `columns` | id, name (UNIQUE), position, created_at | [NOVO] Colunas Kanban persistidas |
| `labels` | id, name (UNIQUE), color, created_at | [NOVO] Labels persistidas |

---

## 5. Pontos de Entrada

| Tipo | Caminho | Descrição |
|------|---------|-----------|
| App entry (UI) | `app/layout.tsx` | Root layout |
| App entry (SPA) | `app/page.tsx` | Kanban completo |
| Middleware | `middleware.ts` | Auth gate para API routes |
| API | `app/api/auth/login/route.ts` | POST login (bcrypt) |
| API | `app/api/tasks/route.ts` | CRUD tasks + agregação |
| API | `app/api/subtasks/route.ts` | CRUD subtasks + tempo |
| API | `app/api/timer/route.ts` | Controle de cronômetro |
| API | `app/api/columns/route.ts` | CRUD columns (DB) |
| API | `app/api/comments/route.ts` | CRUD comments (c/ subtask) |
| API | `app/api/labels/route.ts` | CRUD labels (DB) |
| API | `app/api/notifications/route.ts` | GET/PATCH/DELETE |
| API | `app/api/users/route.ts` | CRUD users (bcrypt) |
| API | `app/api/files/route.ts` | GET/DELETE files |
| API | `app/api/upload/route.ts` | POST upload |

---

## 6. Integrações Externas

| Serviço | SDK | Uso |
|---------|-----|-----|
| **Supabase** | `@supabase/ssr`, `@supabase/supabase-js` | PostgreSQL, Storage, Realtime |
| **Vercel Analytics** | `@vercel/analytics` | Analytics |
| **bcryptjs** | `bcryptjs` | [NOVO] Hash de senhas |

---

## 7. Contagem de Arquivos por Linguagem

| Linguagem | Extensão | Arquivos |
|-----------|----------|---------|
| TypeScript React | `.tsx` | 59 |
| TypeScript | `.ts` | 19 |
| JavaScript (ESM) | `.mjs` | 2 |
| CSS | `.css` | 2 |
| SQL | `.sql` | 3 |
| JSON (config) | `.json` | 4 |
| **Total** | | **89** |

---

## 8. Observações e Alertas (Atualizado)

> 🟢 **CORRIGIDO** — Senhas agora usam bcrypt (`bcryptjs`). Hash feito no cadastro e na atualização. Login com suporte retroativo (senhas antigas atualizadas no próximo login).

> 🟢 **CORRIGIDO** — `middleware.ts` protege POST/PATCH/DELETE nas rotas `/api/*`. Login define cookie de sessão `session_user_id`.

> 🟢 **CORRIGIDO** — Colunas agora são persistidas na tabela `columns` (migration 003). POST e DELETE funcionam com o banco.

> 🟢 **CORRIGIDO** — Labels agora são persistidas na tabela `labels` (migration 003). GET retorna labels reais do banco.

> 🟢 **NOVO** — Subtarefas com tabela própria `subtasks`, CRUD via `/api/subtasks`, cronômetro automático via `/api/timer`.

> 🔴 **LACUNA** — DDL das tabelas `tasks`, `task_comments`, `team_members` e `notifications` ainda não encontrada em migrations.

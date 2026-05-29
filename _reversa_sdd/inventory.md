# Inventário do Projeto — BrolabTask

> Gerado pelo Scout em: 2026-05-29 | Agente: reversa-scout

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
│   ├── globals.css               # Estilos globais (duplicate de styles/)
│   ├── layout.tsx                # Root layout (JetBrains Mono + Analytics)
│   ├── page.tsx                  # Aplicação principal (Kanban monolítico ~1500+ LOC)
│   └── api/                      # API Routes (REST via Next.js Route Handlers)
│       ├── auth/login/route.ts   # POST /api/auth/login
│       ├── columns/route.ts      # GET/POST/DELETE /api/columns
│       ├── comments/route.ts     # POST /api/comments
│       ├── files/route.ts        # GET/DELETE /api/files
│       ├── labels/route.ts       # GET/POST/DELETE /api/labels
│       ├── notifications/route.ts # GET/PATCH/DELETE /api/notifications
│       ├── tasks/route.ts        # GET/POST/PATCH/DELETE /api/tasks
│       ├── upload/route.ts       # POST /api/upload
│       └── users/route.ts        # GET/POST /api/users
│
├── components/
│   ├── theme-provider.tsx        # next-themes provider
│   └── ui/                       # Design system shadcn/ui (57 componentes)
│       ├── accordion.tsx
│       ├── alert.tsx / alert-dialog.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx / button-group.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── chart.tsx (Recharts wrapper)
│       ├── checkbox.tsx
│       ├── command.tsx (cmdk)
│       ├── dialog.tsx
│       ├── drawer.tsx (vaul)
│       ├── dropdown-menu.tsx
│       ├── form.tsx (react-hook-form + zod)
│       ├── input.tsx / input-group.tsx / input-otp.tsx
│       ├── sidebar.tsx
│       ├── sonner.tsx (toasts)
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── toast.tsx / toaster.tsx
│       └── ... (demais primitivos Radix UI)
│
├── hooks/
│   ├── use-mobile.ts             # Hook breakpoint mobile
│   └── use-toast.ts              # Hook toast
│
├── lib/
│   ├── utils.ts                  # cn() helper (clsx + tailwind-merge)
│   └── supabase/
│       ├── admin.ts              # createAdminClient() — service_role, sem RLS
│       ├── client.ts             # createClient() — browser (anon key)
│       └── server.ts             # createClient() — servidor (cookies SSR)
│
├── public/                       # Assets estáticos (ícones, placeholders)
├── scripts/
│   └── dev-server.mjs            # Dev server com port-finding dinâmico (Bun)
├── styles/
│   └── globals.css               # CSS global alternativo
├── supabase/
│   └── migrations/
│       └── 001_create_task_files.sql  # DDL: tabela task_files
│
├── .env.local                    # Variáveis de ambiente (Supabase keys)
├── components.json               # Config shadcn/ui
├── next.config.mjs               # Next.js config (TS errors ignorados no build)
├── package.json                  # Dependências e scripts
├── tsconfig.json                 # TypeScript config (strict mode)
└── vercel.json                   # Config deploy Vercel
```

---

## 3. Módulos Identificados

| Módulo | Caminho | Tipo | Responsabilidade |
|--------|---------|------|-----------------|
| **auth** | `app/api/auth/login/` | API Route | Login por email ou @username contra `team_members` |
| **tasks** | `app/api/tasks/` | API Route | CRUD completo de tarefas com agregação de comments + files |
| **columns** | `app/api/columns/` | API Route | Colunas Kanban — configuração estática em memória |
| **comments** | `app/api/comments/` | API Route | Criação de comentários + disparo de notificações de @menção |
| **files** | `app/api/files/` | API Route | Listagem e exclusão de arquivos vinculados a tasks |
| **upload** | `app/api/upload/` | API Route | Upload de arquivos para Supabase Storage (bucket `task-files`) |
| **labels** | `app/api/labels/` | API Route | Labels de tarefa — estado em memória, sem persistência própria |
| **notifications** | `app/api/notifications/` | API Route | Notificações de @menção: GET/PATCH/DELETE por `user_id` |
| **users** | `app/api/users/` | API Route | CRUD de membros da equipe (`team_members`) |
| **lib/supabase** | `lib/supabase/` | Infra | Clientes Supabase: admin (service_role), server (SSR), client (browser) |
| **ui** | `components/ui/` | Design System | 57 componentes shadcn/ui (Radix UI + Tailwind) |
| **kanban-app** | `app/page.tsx` | Frontend | SPA monolítica: login, board, drag & drop, modais, notificações |

---

## 4. Banco de Dados

| Arquivo | Tipo | Conteúdo |
|---------|------|---------|
| `supabase/migrations/001_create_task_files.sql` | DDL migration | Tabela `task_files` com FK para `tasks` |

**Tabelas inferidas do código (sem DDL explícita):**

| Tabela | Inferida de | Colunas detectadas |
|--------|------------|-------------------|
| `tasks` | `app/api/tasks/route.ts` | id, title, description, status (=columnId), position, assignees[], labels[], created_at |
| `task_comments` | `app/api/tasks/route.ts`, `comments/route.ts` | id, task_id, author_username, content, created_at |
| `task_files` | migration + `files/route.ts`, `upload/route.ts` | id, task_id, name, size, type, path, created_at |
| `team_members` | `auth/route.ts`, `users/route.ts` | id, name, username, email, password, role, role_id, created_at |
| `notifications` | `notifications/route.ts` | id, user_id, type, message, task_id, task_title, from_user, read, created_at |

> 🟡 **INFERIDO** — DDL completa não disponível; colunas extraídas de queries e inserts do código.

---

## 5. Pontos de Entrada

| Tipo | Caminho | Descrição |
|------|---------|-----------|
| App entry (UI) | `app/layout.tsx` | Root layout Next.js — fonte, analytics, metadata |
| App entry (SPA) | `app/page.tsx` | Aplicação Kanban completa (client component) |
| API entry | `app/api/auth/login/route.ts` | POST login |
| API entry | `app/api/tasks/route.ts` | GET/POST/PATCH/DELETE tasks |
| API entry | `app/api/columns/route.ts` | GET/POST/DELETE columns |
| API entry | `app/api/comments/route.ts` | POST comments |
| API entry | `app/api/files/route.ts` | GET/DELETE files |
| API entry | `app/api/labels/route.ts` | GET/POST/DELETE labels |
| API entry | `app/api/notifications/route.ts` | GET/PATCH/DELETE notifications |
| API entry | `app/api/upload/route.ts` | POST upload |
| API entry | `app/api/users/route.ts` | GET/POST users |
| Script | `scripts/dev-server.mjs` | Dev server com port autodiscovery (Bun) |

---

## 6. Configuração e Infraestrutura

| Arquivo | Função |
|---------|--------|
| `.env.local` | Variáveis Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`) |
| `next.config.mjs` | TypeScript errors ignorados no build; imagens não otimizadas |
| `tsconfig.json` | TypeScript strict, paths alias `@/*` |
| `vercel.json` | Deploy Vercel, `next build`, framework `nextjs` |
| `components.json` | shadcn/ui config (paths, estilo, baseColor) |
| `postcss.config.mjs` | Tailwind CSS 4 via `@tailwindcss/postcss` |

---

## 7. CI/CD e Docker

| Item | Status |
|------|--------|
| GitHub Actions | ❌ Não configurado |
| Docker / docker-compose | ❌ Não configurado |
| Vercel deploy automático | ✅ Via `vercel.json` — deploy a cada push em `main` |

---

## 8. Testes

| Item | Status |
|------|--------|
| Framework de testes | ❌ Nenhum configurado |
| Arquivos `*.test.*` | 0 encontrados |
| Arquivos `*.spec.*` | 0 encontrados |
| Cobertura estimada | 0% |

---

## 9. Integrações Externas

| Serviço | SDK | Uso |
|---------|-----|-----|
| **Supabase** | `@supabase/ssr` 0.10.3, `@supabase/supabase-js` (via admin) | Banco de dados (PostgreSQL), Storage (task-files), Auth customizada via `team_members` |
| **Vercel Analytics** | `@vercel/analytics` 1.6.1 | Analytics de produção |
| **v0.app** | — | Plataforma de geração de UI (origem do projeto) |

---

## 10. Contagem de Arquivos por Linguagem

| Linguagem | Extensão | Arquivos |
|-----------|----------|---------|
| TypeScript React | `.tsx` | 59 |
| TypeScript | `.ts` | 17 |
| JavaScript (ESM) | `.mjs` | 2 |
| CSS | `.css` | 2 |
| SQL | `.sql` | 1 |
| JSON (config) | `.json` | 4 |
| Markdown | `.md` | 1 |
| **Total** | | **86** |

---

## 11. Observações e Alertas

> 🔴 **LACUNA** — Autenticação implementada com senha em plaintext na tabela `team_members` (sem hash). Risco de segurança crítico.

> 🔴 **LACUNA** — DDL das tabelas `tasks`, `task_comments`, `team_members` e `notifications` não encontrada em migrations. Apenas `task_files` tem DDL explícita.

> 🟡 **INFERIDO** — Colunas Kanban são estáticas (hardcoded em memória): `BACKLOG`, `FAZENDO`, `ALTERAÇÕES`, `APROVADO`, `FEITO`. Não há persistência de colunas customizadas.

> 🟡 **INFERIDO** — Labels são armazenadas como array de strings `TEXT[]` em `tasks.labels`, sem tabela separada. O endpoint `/api/labels` retorna lista vazia (`GET`) e simula criação em memória (`POST`).

> 🟢 **CONFIRMADO** — `createAdminClient()` usa `service_role_key` com `persistSession: false`, padrão correto para operações admin sem RLS.

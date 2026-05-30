# Arquitetura — BrolabTask

> Gerado pelo Architect em: 2026-05-29 | doc_level: detalhado

---

## Visão Geral

**BrolabTask** é um gerenciador de tarefas estilo Kanban com estética terminal hacker. A aplicação é uma SPA Next.js 16 (App Router) que serve como frontend e como BFF (Backend-for-Frontend) via API Routes, usando Supabase como backend de dados, storage e realtime.

---

## Estilo Arquitetural

| Atributo | Valor | Confiança |
|----------|-------|-----------|
| Estilo principal | **Monolito Modular** (frontend + BFF unificados) | 🟢 CONFIRMADO |
| Padrão de API | REST (fetch nativo, sem cliente HTTP) | 🟢 CONFIRMADO |
| Gerenciamento de estado | useState React local (sem Context/Redux/Zustand) | 🟢 CONFIRMADO |
| Renderização | CSR (Client-Side Rendering) — SPA com `"use client"` | 🟢 CONFIRMADO |
| Banco de dados | Relacional (PostgreSQL via Supabase) | 🟢 CONFIRMADO |
| Storage de arquivos | Object Storage (Supabase Storage / S3-compatible) | 🟢 CONFIRMADO |
| Comunicação em tempo real | WebSocket via Supabase Realtime (`postgres_changes`) | 🟢 CONFIRMADO |
| Deploy | PaaS Vercel (auto-deploy por push em `main`) | 🟢 CONFIRMADO |

---

## Stack Técnica

### Frontend
| Tecnologia | Versão | Papel |
|------------|--------|-------|
| Next.js | 16.2.6 | Framework full-stack (App Router) |
| React | 19 | UI Library |
| TypeScript | 5.7.3 | Linguagem |
| Tailwind CSS | 4.x | Estilização (via `@tailwindcss/postcss`) |
| shadcn/ui | — | Componentes Radix UI (57 componentes, **quase nenhum usado na SPA**) |
| JetBrains Mono | 5.2.8 | Fonte terminal |
| Lucide React | 0.564.0 | Ícones |

### Backend (API Routes)
| Tecnologia | Versão | Papel |
|------------|--------|-------|
| Next.js Route Handlers | 16.2.6 | Endpoints REST (`app/api/**/route.ts`) |
| @supabase/supabase-js | (via @supabase/ssr) | Cliente do banco / storage |
| @supabase/ssr | 0.10.3 | Cliente SSR com cookies |

### Infraestrutura
| Serviço | Papel |
|---------|-------|
| Supabase PostgreSQL | Banco de dados relacional |
| Supabase Storage | Object storage (arquivos de tasks) |
| Supabase Realtime | WebSocket para notificações |
| Vercel | Hosting, build, CI/CD |

### Runtime
| Ambiente | Runtime |
|----------|---------|
| Desenvolvimento | Bun (`scripts/dev-server.mjs`) |
| Build/Deploy | npm (via `vercel.json`) |

---

## Mapa de Módulos

```
brolab-task/
├── app/
│   ├── page.tsx              ← SPA principal (~1960 LOC) — TODO o frontend
│   ├── layout.tsx            ← Shell HTML + providers
│   ├── globals.css           ← Estilos globais
│   └── api/
│       ├── auth/login/       ← POST: autenticação customizada
│       ├── tasks/            ← CRUD tasks (agrega subtasks)
│       ├── subtasks/         ← [NOVO] CRUD subtasks + tempo
│       ├── timer/            ← [NOVO] Cronômetro automático
│       ├── columns/          ← Colunas (persistido no DB)
│       ├── comments/         ← CRUD comentários + @mentions + subtasks
│       ├── files/            ← GET + DELETE arquivos
│       ├── upload/           ← POST upload multipart
│       ├── labels/           ← Labels (persistido no DB)
│       ├── notifications/    ← GET + PATCH + DELETE notificações
│       └── users/            ← CRUD membros (bcrypt)
├── lib/
│   └── supabase/
│       ├── admin.ts          ← Client service_role (sem RLS)
│       ├── server.ts         ← Client SSR (com cookies)
│       └── client.ts         ← Client browser (Realtime)
├── components/ui/            ← 57 componentes shadcn/ui (Radix)
└── supabase/
    └── migrations/           ← DDL incremental
```

---

## Fluxo de Dados Principal

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (React SPA)                        │
│                                                                    │
│  BroLabTask (root)                                                 │
│  ├── estado: currentUser, team, columns+tasks, notifications      │
│  ├── useEffect: fetchData() → GET /api/tasks + /columns + /users  │
│  ├── useEffect: Realtime subscription → notifications em tempo real│
│  └── Handlers: fetch() para cada operação CRUD                    │
└─────────────────────┬────────────────────────────────────────────┘
                      │ HTTP fetch() REST
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Next.js API Routes (servidor)                   │
│                                                                    │
│  /api/auth/login  /api/tasks  /api/columns  /api/users            │
│  /api/comments    /api/files  /api/upload   /api/notifications    │
│  /api/labels                                                       │
└─────────────────────┬────────────────────────────────────────────┘
                      │ @supabase/supabase-js (service_role)
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Supabase                                   │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │   PostgreSQL     │  │   Storage    │  │     Realtime        │ │
│  │  team_members   │  │  task-files  │  │  postgres_changes   │ │
│  │  tasks          │  │  (S3-compat) │  │  (notifications)    │ │
│  │  subtasks       │  └──────────────┘  └─────────────────────┘ │
│  │  task_comments  │                                              │
│  │  task_files     │                                              │
│  │  notifications  │                                              │
│  │  columns        │                                              │
│  │  labels         │                                              │
│  └─────────────────┘                                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Dívidas Técnicas

### 🔴 CRÍTICAS (impacto de segurança)

| ID | Dívida | Localização | Status |
|----|--------|-------------|--------|
| DT-001 | Senhas em plaintext em `team_members.password` | `app/api/auth/login/route.ts` + `users/route.ts` | ✅ CORRIGIDO (bcryptjs) |
| DT-002 | Sem autenticação/autorização nas API Routes | `middleware.ts` criado | ✅ CORRIGIDO |
| DT-003 | Sem rate limiting no endpoint de login | `app/api/auth/login/route.ts` | ⏳ Pendente |

### 🔴 ALTAS (funcionalidades quebradas) — ✅ TODAS CORRIGIDAS

| ID | Dívida | Localização | Status |
|----|--------|-------------|--------|
| DT-004 | `PATCH /api/users` não implementado | `app/api/users/route.ts` | ✅ CORRIGIDO |
| DT-005 | `DELETE /api/users` não implementado | `app/api/users/route.ts` | ✅ CORRIGIDO |

### 🟡 MÉDIAS (arquitetura e manutenibilidade)

| ID | Dívida | Localização | Impacto |
|----|--------|-------------|---------|
| DT-006 | SPA monolítica ~1960 LOC em um arquivo | `app/page.tsx` | Difícil manutenção, sem lazy loading, bundle grande |
| DT-007 | Colunas hardcoded — sem persistência | `app/api/columns/route.ts` | ✅ CORRIGIDO (tabela `columns`) |
| DT-008 | Labels sem tabela própria (`TEXT[]` em tasks) | `app/api/tasks/route.ts` | ✅ CORRIGIDO (tabela `labels` + persistência de cor) |
| DT-009 | Assignees armazenam nomes (não IDs) | `tasks.assignees TEXT[]` | Sem integridade referencial |
| DT-010 | `getLabelColor()` duplicado em 2 módulos | `tasks/route.ts`, `labels/route.ts` | Inconsistência potencial |
| DT-011 | `window.location.reload()` após upload | `app/page.tsx` | UX degradada sem motivo arquitetural |
| DT-012 | `typescript.ignoreBuildErrors: true` | `next.config.mjs` | Erros de tipo silenciados em produção |

### 🟡 BAIXAS (qualidade de código)

| ID | Dívida | Localização | Impacto |
|----|--------|-------------|---------|
| DT-013 | Erros tratados só com `console.error` | Todos os handlers | Sem feedback visual ao usuário |
| DT-014 | Sem `updated_at` em nenhuma tabela | Banco de dados | Sem auditoria de mudanças |
| DT-015 | Sem paginação em endpoints | `GET /api/tasks`, `GET /api/users` | Degradação com volume |
| DT-016 | Ausência total de testes (unit, integration, e2e) | Todo o projeto | Zero cobertura |
| DT-017 | shadcn/ui instalado mas quase não usado na SPA | `components/ui/` | Bundle desnecessário |

---

## Documentos de Arquitetura

- [c4-context.md](./c4-context.md) — Diagrama C4 Contexto (Nível 1)
- [c4-containers.md](./c4-containers.md) — Diagrama C4 Containers (Nível 2)
- [c4-components.md](./c4-components.md) — Diagrama C4 Componentes (Nível 3)
- [erd-complete.md](./erd-complete.md) — ERD completo com todas as entidades
- [deployment.md](./deployment.md) — Infraestrutura e pipeline de deploy
- [traceability/spec-impact-matrix.md](./traceability/spec-impact-matrix.md) — Matriz de impacto entre componentes

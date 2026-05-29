# C4 — Nível 2: Containers

> Gerado pelo Architect em: 2026-05-29 | doc_level: detalhado

---

## Descrição

O diagrama de containers detalha os processos e armazenamentos que compõem o BrolabTask e o Supabase.

---

## Diagrama

```mermaid
C4Container
    title BrolabTask — Diagrama de Containers (C4 Nível 2)

    Person(membro, "Membro / Admin", "Usuário da aplicação")

    System_Boundary(brolabtask, "BrolabTask (Next.js — Vercel)") {
        Container(spa, "Kanban SPA", "React 19 / TypeScript", "SPA monolítica (~1960 LOC). Todo o UI: board, modais, login, notificações. Gerencia estado com useState.")
        Container(api_routes, "API Routes (BFF)", "Next.js Route Handlers / Node.js", "9 grupos de endpoints REST. Recebe requests do SPA e chama o Supabase com service_role key.")
        Container(supabase_lib, "lib/supabase", "TypeScript", "Três fábricas de cliente: admin (service_role), server (SSR+cookies), browser (anon+Realtime).")
    }

    System_Boundary(supabase_sys, "Supabase") {
        ContainerDb(postgres, "PostgreSQL", "Supabase Managed PostgreSQL", "5 tabelas: team_members, tasks, task_comments, task_files, notifications.")
        Container(storage, "Supabase Storage", "S3-compatible Object Storage", "Bucket 'task-files' (público). Armazena arquivos anexados às tasks.")
        Container(realtime, "Supabase Realtime", "Phoenix Channels / WebSocket", "Canal de postgres_changes. Notifica o browser sobre INSERT em notifications filtrado por user_id.")
    }

    Container_Ext(vercel_cdn, "Vercel Edge Network", "CDN Global", "Serve assets estáticos e executa as API Routes nas Edge Functions.")

    Rel(membro, spa, "Usa", "HTTPS / Browser")
    Rel(spa, api_routes, "Chama endpoints REST", "fetch() / HTTP interno")
    Rel(spa, realtime, "Subscreve notificações em tempo real", "WebSocket (WSS)")
    Rel(api_routes, supabase_lib, "Usa admin client (service_role)", "In-process")
    Rel(supabase_lib, postgres, "Lê e escreve dados", "PostgreSQL / HTTPS")
    Rel(supabase_lib, storage, "Upload e URL pública de arquivos", "HTTPS / S3 API")
    Rel(vercel_cdn, spa, "Serve", "CDN / Edge")
    Rel(vercel_cdn, api_routes, "Executa", "Serverless Functions")
```

---

## Descrição dos Containers

### Kanban SPA (`app/page.tsx`)
| Atributo | Valor |
|----------|-------|
| Tecnologia | React 19, TypeScript, Tailwind CSS 4 |
| Tamanho | ~1960 LOC em um único arquivo |
| Responsabilidade | Todo o UI e lógica de apresentação da aplicação |
| Estado | `useState` em `BroLabTask` (root) — sem Context, Redux ou Zustand |
| Realtime | Supabase browser client para channel `notifications_user_{id}` |
| Dependências externas | `fetch()` para as API Routes; `createBrowserClient` para Realtime |

**17 componentes internos:**
`BroLabTask`, `KanbanBoard`, `KanbanColumn`, `TaskCard`, `TaskEditModal`, `NewTaskForm`, `NewColumnForm`, `Header`, `NotificationBell`, `NotificationsModal`, `TeamAdminModal`, `ProfileEditModal`, `LabelManager`, `LabelBadge`, `MentionInput`, `LoadingScreen`, `LoginScreen`

---

### API Routes BFF (`app/api/**/route.ts`)
| Atributo | Valor |
|----------|-------|
| Tecnologia | Next.js Route Handlers (Node.js serverless) |
| Padrão | REST via fetch nativo |
| Autenticação | ❌ Nenhuma — endpoints abertos |
| Supabase client | `createAdminClient()` (service_role, sem RLS) |

**9 grupos de endpoints:**

| Grupo | Métodos | Observação |
|-------|---------|------------|
| `/api/auth/login` | POST | Autenticação customizada |
| `/api/tasks` | GET, POST, PATCH, DELETE | CRUD com agregação |
| `/api/columns` | GET, POST, DELETE | ⚠️ Hardcoded — sem banco |
| `/api/comments` | POST | Com dispatch de @mentions |
| `/api/files` | GET, DELETE | Metadados de arquivos |
| `/api/upload` | POST | Multipart + Supabase Storage |
| `/api/labels` | GET, POST, DELETE | ⚠️ In-memory — sem banco |
| `/api/notifications` | GET, PATCH, DELETE | REST para read/clear |
| `/api/users` | GET, POST | ⚠️ PATCH e DELETE ausentes → 405 |

---

### lib/supabase
| Arquivo | Client | Uso |
|---------|--------|-----|
| `admin.ts` | `service_role` + `persistSession:false` | API Routes — acesso total sem RLS |
| `server.ts` | `anon` + cookies SSR | Disponível para SSR (pouco usado atualmente) |
| `client.ts` | `anon` + browser | Realtime subscription no SPA |

---

### PostgreSQL (Supabase)
5 tabelas principais — ver [erd-complete.md](./erd-complete.md) para detalhes completos.

---

### Supabase Storage
- Bucket: `task-files` (público, autocriado na primeira chamada de upload)
- Path: `{task_id}/{uuid}.{extensão}`
- Acesso: URL pública permanente via `getPublicUrl()`

---

### Supabase Realtime
- Protocolo: Phoenix Channels sobre WebSocket
- Evento escutado: `INSERT` em `public.notifications`
- Filtro: `user_id=eq.{currentUser.id}`
- Comportamento: novo registro → `setNotifications(prev => [newNotif, ...prev])`

# ERD Completo — BrolabTask

> Gerado pelo Architect em: 2026-05-29 | doc_level: detalhado
> Fonte: `supabase/migrations/001_create_task_files.sql` + inferência a partir de `app/api/**/route.ts`

---

## Diagrama ER

```mermaid
erDiagram
    team_members {
        UUID   id          PK "gen_random_uuid()"
        TEXT   name        "Nome completo"
        TEXT   username    "Prefixado com @"
        TEXT   email       "Único"
        TEXT   password    "✅ bcrypt hash"
        TEXT   role        "ADMIN_TOTAL, ADMIN, COLLABORATOR..."
        TIMESTAMPTZ created_at "DEFAULT NOW()"
    }

    tasks {
        UUID    id           PK "gen_random_uuid()"
        TEXT    title        "Título da task"
        TEXT    description  "Descrição (nullable)"
        TEXT    status       "BACKLOG, FAZENDO..."
        INTEGER position     "Ordem dentro da coluna"
        TEXT[]  assignees    "⚠️ Nomes dos membros (não IDs)"
        TEXT[]  labels       "nome||cor (desde migration 003)"
        TIMESTAMPTZ created_at "DEFAULT NOW()"
    }

    subtasks {
        UUID    id              PK "gen_random_uuid()"
        UUID    task_id         FK "→ tasks.id ON DELETE CASCADE"
        TEXT    title           "Título"
        TEXT    description     "Descrição"
        FLOAT   estimated_hours "Horas estimadas"
        FLOAT   time_spent      "Segundos acumulados de cronômetro"
        TEXT    status          "BACKLOG → FAZENDO → ALTERAÇÕES → APROVADO → FEITO"
        INTEGER position        "Ordem"
        TEXT[]  assignees       "Responsáveis"
        TIMESTAMPTZ timer_started_at "Início do cronômetro (null se parado)"
        TIMESTAMPTZ created_at  "DEFAULT NOW()"
    }

    task_comments {
        UUID    id              PK "gen_random_uuid()"
        UUID    task_id         FK "→ tasks.id"
        UUID    subtask_id      FK "→ subtasks.id ON DELETE CASCADE (opcional)"
        TEXT    author_username "Username do autor"
        TEXT    content         "Conteúdo do comentário"
        TIMESTAMPTZ created_at "DEFAULT NOW()"
    }

    columns {
        UUID    id          PK "gen_random_uuid()"
        TEXT    name        "UNIQUE — BACKLOG, FAZENDO..."
        INTEGER position    "Ordem"
        TIMESTAMPTZ created_at "DEFAULT NOW()"
    }

    labels {
        UUID    id          PK "gen_random_uuid()"
        TEXT    name        "UNIQUE — UPPERCASE"
        TEXT    color       "HEX: #6B7280, #EF4444..."
        TIMESTAMPTZ created_at "DEFAULT NOW()"
    }

    task_files {
        UUID    id         PK "gen_random_uuid()"
        UUID    task_id    FK "→ tasks.id ON DELETE CASCADE"
        TEXT    name       "Nome original do arquivo"
        BIGINT  size       "Tamanho em bytes"
        TEXT    type       "MIME type"
        TEXT    path       "Path no bucket: taskId/uuid.ext"
        TIMESTAMPTZ created_at "DEFAULT NOW()"
    }

    notifications {
        UUID    id          PK "gen_random_uuid()"
        UUID    user_id     FK "→ team_members.id"
        TEXT    type        "mention, task_created, task_updated, task_deleted"
        TEXT    message     "Texto da notificação"
        UUID    task_id     "ID da task relacionada"
        TEXT    task_title  "⚠️ Desnormalizado"
        TEXT    from_user   "Nome do autor da ação"
        BOOLEAN read        "DEFAULT false"
        TIMESTAMPTZ created_at "DEFAULT NOW()"
    }

    tasks           ||--o{ subtasks       : "tem (CASCADE DELETE)"
    tasks           ||--o{ task_comments  : "tem"
    tasks           ||--o{ task_files     : "tem (CASCADE DELETE)"
    subtasks        ||--o{ task_comments  : "tem (CASCADE DELETE)"
    team_members    ||--o{ notifications  : "recebe"
```

---

## Tabelas em Detalhe

### `team_members`
| Campo | Tipo | Constraint | Observação |
|-------|------|------------|------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador único |
| `name` | TEXT | NOT NULL | Nome completo exibido |
| `username` | TEXT | NOT NULL | Sempre prefixado com `@` (ex: `@joao.silva`) |
| `email` | TEXT | NOT NULL | Email de login |
| `password` | TEXT | NOT NULL | 🔴 **PLAINTEXT** — sem hash |
| `role` | TEXT | NOT NULL | String livre. Valores conhecidos: `ADMIN_TOTAL`, `ADMIN`, outros |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Data de criação |

**Índices confirmados:** PK em `id`
**Índices inferidos:** 🟡 Provavelmente sem índice em `email` ou `username` — queries de login fazem full scan

---

### `tasks`
| Campo | Tipo | Constraint | Observação |
|-------|------|------------|------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador único |
| `title` | TEXT | NOT NULL | Título da task |
| `description` | TEXT | nullable | Descrição detalhada |
| `status` | TEXT | NOT NULL | Nome da coluna (funciona como columnId) |
| `position` | INTEGER | NOT NULL | Ordem dentro da coluna |
| `assignees` | TEXT[] | DEFAULT '{}' | 🟡 Nomes dos membros (sem FK) |
| `labels` | TEXT[] | DEFAULT '{}' | 🟡 Nomes das labels (sem tabela de labels) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Data de criação |

> 🔴 **LACUNA:** Sem `updated_at`. Sem índice em `status` (filter frequente).

---

### `task_comments`
| Campo | Tipo | Constraint | Observação |
|-------|------|------------|------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador único |
| `task_id` | UUID | FK → tasks.id | Sem CASCADE explícito nesta tabela |
| `text` | TEXT | NOT NULL | Conteúdo do comentário (pode conter @mentions) |
| `author` | TEXT | NOT NULL | Nome do autor (não ID — mesma desnormalização de assignees) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Data de criação |

> 🟡 **INFERIDO:** Estrutura derivada das queries em `app/api/tasks/route.ts` e `app/api/comments/route.ts`. DDL não encontrado em migrations.

---

### `task_files`
| Campo | Tipo | Constraint | Observação |
|-------|------|------------|------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador único |
| `task_id` | UUID | FK → tasks.id ON DELETE CASCADE | Deleção em cascata |
| `name` | TEXT | NOT NULL | Nome original do arquivo |
| `size` | BIGINT | NOT NULL | Tamanho em bytes |
| `type` | TEXT | NOT NULL | MIME type (ex: `image/png`) |
| `path` | TEXT | NOT NULL | Path no bucket: `{taskId}/{uuid}.{ext}` |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Data de upload |

**Índices confirmados:** PK em `id`, INDEX `idx_task_files_task_id` em `task_id`

---

### `notifications`
| Campo | Tipo | Constraint | Observação |
|-------|------|------------|------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador único |
| `user_id` | UUID | FK → team_members.id | Destinatário da notificação |
| `type` | TEXT | NOT NULL | `mention` (único tipo emitido atualmente) |
| `message` | TEXT | NOT NULL | Texto da notificação |
| `task_id` | UUID | nullable | Task relacionada |
| `task_title` | TEXT | nullable | 🟡 Desnormalizado — título no momento da criação |
| `from_user` | TEXT | NOT NULL | Nome do usuário que disparou |
| `read` | BOOLEAN | DEFAULT false | Flag de leitura |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Data de criação |

> 🟡 **INFERIDO:** `task_id` e `task_title` inferidos a partir da interface TypeScript `Notification` em `app/page.tsx` e do código em `app/api/comments/route.ts`.

---

## Relacionamentos

| Relacionamento | Cardinalidade | Tipo | Implementação |
|---------------|---------------|------|---------------|
| tasks → task_comments | 1 : N | Física (FK) | `task_comments.task_id` |
| tasks → task_files | 1 : N | Física (FK + CASCADE) | `task_files.task_id` |
| team_members → notifications | 1 : N | Física (FK) | `notifications.user_id` |
| tasks → assignees | 1 : N | **Lógica** (TEXT[]) | `tasks.assignees[]` (nomes, sem FK) |
| tasks → labels | 1 : N | **Lógica** (TEXT[]) | `tasks.labels[]` (nomes, sem FK) |
| tasks → notifications | 1 : N | **Lógica** (TEXT) | `notifications.task_id` UUID sem FK declarado |

---

## Entidades Ausentes (Lacunas de Modelo)

| Entidade | Por que deveria existir | Impacto |
|----------|------------------------|---------|
| `columns` | Colunas hardcoded em código | Customização de workflow impossível |
| `labels` | Labels como `TEXT[]` sem rastreabilidade | Sem histórico, rename quebra cor |
| `task_assignees` | Tabela de junção tasks↔team_members | Integridade referencial para assignees |
| `sessions` / tokens | Autenticação sem estado server-side | Sem invalidação de sessão |

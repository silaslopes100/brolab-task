# Dicionário de Dados — BrolabTask

> Gerado pelo Archaeologist em: 2026-05-29 | doc_level: detalhado
> Atualizado em: 2026-05-30 — novas tabelas: subtasks, columns, labels; password → bcrypt

---

## Entidades de Banco de Dados (Supabase/PostgreSQL)

---

### `team_members`

Usuários do sistema. Autenticação customizada — não usa Supabase Auth.

| Campo | Tipo DB | Nullable | Constraints | Descrição |
|-------|---------|----------|-------------|-----------|
| `id` | `UUID` | NOT NULL | PK, DEFAULT gen_random_uuid() | Identificador único |
| `email` | `TEXT` | NOT NULL | UNIQUE | E-mail de login. Normalizado para lowercase |
| `username` | `TEXT` | NOT NULL | UNIQUE | @handle. Sempre prefixado com `@` |
| `name` | `TEXT` | NOT NULL | — | Nome em UPPER_SNAKE_CASE |
| `password` | `TEXT` | NOT NULL | — | ✅ **HASH bcrypt** (desde migration 2026-05-30) |
| `role` | `TEXT` | NOT NULL | — | `ADMIN_TOTAL`, `ADMIN`, `COLLABORATOR` |
| `role_id` | `TEXT` | NULL | — | Sem uso confirmado |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | DEFAULT now() | Timestamp de criação |

**isAdmin:** Calculado (`role === "ADMIN_TOTAL" || role === "ADMIN"`)

---

### `tasks`

Tarefas do Kanban. Coluna é representada pelo campo `status`.

| Campo | Tipo DB | Nullable | Constraints | Descrição |
|-------|---------|----------|-------------|-----------|
| `id` | `UUID` | NOT NULL | PK | Identificador único |
| `title` | `TEXT` | NOT NULL | — | Título da tarefa |
| `description` | `TEXT` | NULL | DEFAULT '' | Descrição |
| `status` | `TEXT` | NOT NULL | — | Coluna atual (BACKLOG, FAZENDO, etc) |
| `position` | `INTEGER` | NOT NULL | DEFAULT 0 | Ordem dentro da coluna |
| `assignees` | `TEXT[]` | NOT NULL | DEFAULT '{}' | Nomes dos membros |
| `labels` | `TEXT[]` | NOT NULL | DEFAULT '{}' | Formato `nome||cor` desde 2026-05-30 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | DEFAULT now() | |

---

### `subtasks` [NOVO]

Subtarefas com controle de horas estimadas e cronômetro.

| Campo | Tipo DB | Nullable | Constraints | Descrição |
|-------|---------|----------|-------------|-----------|
| `id` | `UUID` | NOT NULL | PK | Identificador único |
| `task_id` | `UUID` | NOT NULL | FK → tasks.id ON DELETE CASCADE | Tarefa pai |
| `title` | `TEXT` | NOT NULL | — | Título |
| `description` | `TEXT` | NULL | DEFAULT '' | Descrição |
| `estimated_hours` | `DOUBLE PRECISION` | NULL | DEFAULT 0 | Horas estimadas |
| `time_spent` | `DOUBLE PRECISION` | NULL | DEFAULT 0 | Segundos acumulados de cronômetro |
| `status` | `TEXT` | NOT NULL | DEFAULT 'BACKLOG' | BACKLOG → FAZENDO → ALTERAÇÕES → APROVADO → FEITO |
| `position` | `INTEGER` | NOT NULL | DEFAULT 0 | Ordem |
| `assignees` | `TEXT[]` | NULL | DEFAULT '{}' | Responsáveis |
| `timer_started_at` | `TIMESTAMPTZ` | NULL | — | Início do cronômetro (null = parado) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | DEFAULT now() | |

**Regras do cronômetro:**
- Inicia automaticamente ao mudar de BACKLOG para outro status
- Para/contabiliza ao chegar em APROVADO (status 3)
- Tempo vivo calculado na API: `time_spent + (now - timer_started_at)` se timer rodando

---

### `task_comments`

| Campo | Tipo DB | Nullable | Constraints | Descrição |
|-------|---------|----------|-------------|-----------|
| `id` | `UUID` | NOT NULL | PK | Identificador único |
| `task_id` | `UUID` | NOT NULL | FK → tasks.id | Tarefa principal |
| `subtask_id` | `UUID` | NULL | FK → subtasks.id ON DELETE CASCADE | [NOVO] Subtarefa (opcional) |
| `author_username` | `TEXT` | NULL | — | Username do autor |
| `content` | `TEXT` | NOT NULL | — | Conteúdo |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | DEFAULT now() | |

---

### `task_files`

| Campo | Tipo DB | Nullable | Constraints | Descrição |
|-------|---------|----------|-------------|-----------|
| `id` | `UUID` | NOT NULL | PK | |
| `task_id` | `UUID` | NOT NULL | FK → tasks.id ON DELETE CASCADE | |
| `name` | `TEXT` | NOT NULL | — | Nome original |
| `size` | `BIGINT` | NOT NULL | — | Bytes |
| `type` | `TEXT` | NOT NULL | — | MIME type |
| `path` | `TEXT` | NOT NULL | — | `{taskId}/{uuid}.{ext}` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | DEFAULT now() | |

---

### `notifications`

| Campo | Tipo DB | Nullable | Constraints | Descrição |
|-------|---------|----------|-------------|-----------|
| `id` | `UUID` | NOT NULL | PK | |
| `user_id` | `UUID` | NOT NULL | FK → team_members.id | Destinatário |
| `type` | `TEXT` | NOT NULL | — | mention, task_created, task_updated, task_deleted |
| `message` | `TEXT` | NOT NULL | — | Texto |
| `task_id` | `UUID` | NULL | — | Task relacionada |
| `task_title` | `TEXT` | NULL | — | Título desnormalizado |
| `from_user` | `TEXT` | NULL | — | Quem gerou |
| `read` | `BOOLEAN` | NOT NULL | DEFAULT false | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | DEFAULT now() | |

---

### `columns` [NOVO]

| Campo | Tipo DB | Nullable | Constraints | Descrição |
|-------|---------|----------|-------------|-----------|
| `id` | `UUID` | NOT NULL | PK | |
| `name` | `TEXT` | NOT NULL | UNIQUE | Nome (BACKLOG, FAZENDO, etc) |
| `position` | `INTEGER` | NOT NULL | DEFAULT 0 | Ordem |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | DEFAULT now() | |

**Seed:** BACKLOG(0), FAZENDO(1), ALTERAÇÕES(2), APROVADO(3), FEITO(4)

---

### `labels` [NOVO]

| Campo | Tipo DB | Nullable | Constraints | Descrição |
|-------|---------|----------|-------------|-----------|
| `id` | `UUID` | NOT NULL | PK | |
| `name` | `TEXT` | NOT NULL | UNIQUE | Nome UPPERCASE |
| `color` | `TEXT` | NOT NULL | DEFAULT '#6B7280' | HEX da cor |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | DEFAULT now() | |

---

## Entidades de Storage

### Bucket: `task-files`

Público. Path: `{task_id}/{uuid}.{ext}`.

---

## Entidades de Frontend (TypeScript)

### `Subtask` [NOVO]
```typescript
interface Subtask {
  id: string; taskId: string; title: string; description: string;
  estimatedHours: number; timeSpent: number; status: string;
  position: number; assignees: string[]; comments: Comment[];
  timerStartedAt: string | null; createdAt: string;
}
```

### `Task` (atualizado)
```typescript
interface Task {
  // ... campos existentes
  subtaskCount?: number;
  totalEstimatedHours?: number;
  totalTimeSpent?: number;
}
```

### `Comment` (atualizado)
```typescript
interface Comment {
  id: string; authorId: string; authorName: string; content: string;
  createdAt: string; mentions?: string[]; subtaskId?: string | null;
}
```

---

## Lacunas Resolvidas

| # | Severidade | Lacuna | Status |
|---|-----------|--------|--------|
| 1 | 🔴 CRÍTICO | `team_members.password` em plaintext | ✅ CORRIGIDO (bcrypt) |
| 2 | 🔴 ALTO | Labels sem tabela própria | ✅ CORRIGIDO (tabela `labels`) |
| 3 | 🔴 ALTO | Colunas sem tabela no banco | ✅ CORRIGIDO (tabela `columns`) |
| 4 | 🟡 MÉDIO | `tasks.assignees` armazena nomes | ⏳ Pendente |
| 5 | 🟡 MÉDIO | `task_title` desnormalizado | ⏳ Pendente |
| 6 | 🟡 BAIXO | Sem `updated_at` | ⏳ Pendente |

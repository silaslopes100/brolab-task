# Dicionário de Dados — BrolabTask

> Gerado pelo Archaeologist em: 2026-05-29 | doc_level: detalhado

---

## Entidades de Banco de Dados (Supabase/PostgreSQL)

---

### `team_members`

Usuários do sistema. Autenticação customizada — não usa Supabase Auth.

| Campo | Tipo DB | Tipo TS | Nullable | Constraints | Descrição |
|-------|---------|---------|----------|-------------|-----------|
| `id` | `UUID` | `string` | NOT NULL | PK, DEFAULT gen_random_uuid() | Identificador único do membro |
| `email` | `TEXT` | `string` | NOT NULL | UNIQUE (inferido) | E-mail de login. Normalizado para lowercase |
| `username` | `TEXT` | `string` | NOT NULL | UNIQUE (inferido) | @handle. Sempre prefixado com `@`. Ex: `@joao.silva` |
| `name` | `TEXT` | `string` | NOT NULL | — | Nome em UPPER_SNAKE_CASE. Ex: `JOAO_SILVA` |
| `password` | `TEXT` | `string` | NOT NULL | — | 🔴 Senha em PLAINTEXT. Nunca hasheada |
| `role` | `TEXT` | `string` | NOT NULL | — | Role em UPPER_SNAKE_CASE. Ex: `ADMIN`, `COLLABORATOR`, `ADMIN_TOTAL` |
| `role_id` | `TEXT` | `string \| undefined` | NULL | — | Identificador de papel customizado (uso não confirmado) |
| `created_at` | `TIMESTAMPTZ` | `string` | NOT NULL | DEFAULT now() | Timestamp de criação |

**Roles conhecidos:** `ADMIN_TOTAL`, `ADMIN`, `COLLABORATOR`

**isAdmin:** Calculado no momento do login (`role === "ADMIN_TOTAL" || role === "ADMIN"`) — não é uma coluna.

---

### `tasks`

Tarefas do Kanban. Coluna é representada pelo campo `status`.

| Campo | Tipo DB | Tipo TS | Nullable | Constraints | Descrição |
|-------|---------|---------|----------|-------------|-----------|
| `id` | `UUID` | `string` | NOT NULL | PK, DEFAULT gen_random_uuid() | Identificador único da tarefa |
| `title` | `TEXT` | `string` | NOT NULL | — | Título da tarefa |
| `description` | `TEXT` | `string` | NULL | DEFAULT '' | Descrição. Pode ser vazio |
| `status` | `TEXT` | `string` | NOT NULL | — | Coluna atual. Mapeado para `columnId` na API. Ex: `BACKLOG`, `FAZENDO` |
| `position` | `INTEGER` | `number` | NOT NULL | DEFAULT 0 | Ordem da tarefa dentro da coluna. Usado para ordenação ASC |
| `assignees` | `TEXT[]` | `string[]` | NOT NULL | DEFAULT '{}' | Array de nomes de membros atribuídos. Armazena `member.name` (não ID) |
| `labels` | `TEXT[]` | `string[]` | NOT NULL | DEFAULT '{}' | Array de nomes de labels. **Não há tabela de labels** |
| `created_at` | `TIMESTAMPTZ` | `string` | NOT NULL | DEFAULT now() | Timestamp de criação |

**Nota sobre `assignees`:** Armazena o campo `name` do membro (em UPPER_SNAKE), não o `id`. Sem integridade referencial.

**Nota sobre `labels`:** Cada string é o nome da label. A cor é calculada dinamicamente por `getLabelColor(name)`. Sem tabela `labels`.

---

### `task_comments`

Comentários em tarefas. Suporta @menções que geram notificações.

| Campo | Tipo DB | Tipo TS | Nullable | Constraints | Descrição |
|-------|---------|---------|----------|-------------|-----------|
| `id` | `UUID` | `string` | NOT NULL | PK, DEFAULT gen_random_uuid() | Identificador único do comentário |
| `task_id` | `UUID` | `string` | NOT NULL | FK → `tasks.id` ON DELETE CASCADE | Tarefa à qual o comentário pertence |
| `author_id` | `UUID` | `string \| null` | NULL | FK → `team_members.id` (inferido) | ID do autor. Pode ser null |
| `author_name` | `TEXT` | `string` | NULL | — | Nome de exibição do autor |
| `author_username` | `TEXT` | `string` | NULL | — | Username do autor (sem @) |
| `content` | `TEXT` | `string` | NOT NULL | — | Conteúdo do comentário. Pode conter `@username` para menções |
| `created_at` | `TIMESTAMPTZ` | `string` | NOT NULL | DEFAULT now() | Timestamp de criação |

**Frontend TS Interface (projetada):**
```typescript
interface Comment {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}
```

---

### `task_files`

Metadados dos arquivos anexados a tarefas. O arquivo físico fica no Supabase Storage.

| Campo | Tipo DB | Tipo TS | Nullable | Constraints | Descrição |
|-------|---------|---------|----------|-------------|-----------|
| `id` | `UUID` | `string` | NOT NULL | PK, DEFAULT gen_random_uuid() | Identificador único do arquivo |
| `task_id` | `UUID` | `string` | NOT NULL | FK → `tasks.id` ON DELETE CASCADE | Tarefa à qual o arquivo pertence |
| `name` | `TEXT` | `string` | NOT NULL | — | Nome original do arquivo |
| `size` | `BIGINT` | `number` | NOT NULL | — | Tamanho em bytes |
| `type` | `TEXT` | `string` | NOT NULL | — | MIME type do arquivo. Ex: `image/png` |
| `path` | `TEXT` | `string` | NOT NULL | — | Caminho no bucket: `{taskId}/{uuid}.{ext}` |
| `created_at` | `TIMESTAMPTZ` | `string` | NOT NULL | DEFAULT now() | Timestamp de upload |

**Index:** `idx_task_files_task_id ON task_files(task_id)` (da migration 001)

**Frontend TS Interface:**
```typescript
interface TaskFile {
  id: string
  name: string
  size: number
  type: string
  url: string  // publicUrl gerada em runtime, não armazenada
}
```

---

### `notifications`

Notificações de @menção em comentários. Recebidas em tempo real via Supabase Realtime.

| Campo | Tipo DB | Tipo TS | Nullable | Constraints | Descrição |
|-------|---------|---------|----------|-------------|-----------|
| `id` | `UUID` | `string` | NOT NULL | PK, DEFAULT gen_random_uuid() | Identificador único da notificação |
| `user_id` | `UUID` | `string` | NOT NULL | FK → `team_members.id` (inferido) | Usuário destinatário da notificação |
| `type` | `TEXT` | `string` | NOT NULL | — | Tipo. Valor conhecido: `'mention'` |
| `message` | `TEXT` | `string` | NOT NULL | — | Texto da notificação. Ex: `"@joao mencionou você na tarefa 'Fix bug'"` |
| `task_id` | `UUID` | `string` | NULL | FK → `tasks.id` (inferido) | Tarefa relacionada |
| `task_title` | `TEXT` | `string` | NULL | — | Título da tarefa (desnormalizado para performance) |
| `from_user` | `TEXT` | `string` | NULL | — | Username de quem gerou a notificação |
| `read` | `BOOLEAN` | `boolean` | NOT NULL | DEFAULT false | Se o usuário já leu a notificação |
| `created_at` | `TIMESTAMPTZ` | `string` | NOT NULL | DEFAULT now() | Timestamp de criação |

**Frontend TS Interface:**
```typescript
interface Notification {
  id: string
  type: string
  message: string
  taskId: string
  taskTitle: string
  fromUser: string
  createdAt: string
  read: boolean
}
```

**Mapeamento de campos (API → Frontend):**
```
n.id           → id
n.type         → type
n.message      → message
n.task_id      → taskId
n.task_title   → taskTitle
n.from_user    → fromUser
n.created_at   → createdAt
n.read         → read
```

---

## Entidades de Storage (Supabase Storage)

### Bucket: `task-files`

| Propriedade | Valor |
|-------------|-------|
| Nome | `task-files` |
| Público | `true` (URLs públicas acessíveis sem autenticação) |
| Criação | Automática no primeiro upload (POST `/api/upload`) |

**Estrutura de path:**
```
task-files/
  {task_id}/
    {uuid}.{ext}      ← ex: "abc123.pdf", "def456.png"
```

---

## Entidades de Frontend (TypeScript Interfaces)

Definidas em `app/page.tsx`.

### `Label`
```typescript
interface Label {
  id: string       // temporário: Date.now().toString() na criação local, ou name na API
  name: string     // UPPERCASE. Ex: "BUG", "FEATURE"
  color: string    // HEX calculado por getLabelColor(name)
}
```

### `Comment`
```typescript
interface Comment {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}
```

### `TaskFile`
```typescript
interface TaskFile {
  id: string
  name: string
  size: number
  type: string
  url: string      // URL pública do Supabase Storage (não persistida no DB)
}
```

### `Task`
```typescript
interface Task {
  id: string
  title: string
  description: string
  columnId: string  // = tasks.status no banco
  position: number
  assignees: string[]  // nomes dos membros (tasks.assignees no banco)
  labels: Label[]      // projetado de tasks.labels TEXT[]
  comments: Comment[]  // de task_comments
  files: TaskFile[]    // de task_files
  createdAt: string
}
```

### `Column`
```typescript
interface Column {
  id: string     // = nome da coluna (hardcoded)
  name: string   // ex: "BACKLOG"
  tasks: Task[]  // associados por client-side filter
}
```

### `TeamMember`
```typescript
interface TeamMember {
  id: string
  name: string      // UPPER_SNAKE_CASE
  username: string  // lowercase, sem @
  email: string     // lowercase
  role: string      // UPPER_SNAKE_CASE
  isAdmin: boolean  // calculado (não campo de banco)
}
```

### `Notification`
```typescript
interface Notification {
  id: string
  type: string
  message: string
  taskId: string
  taskTitle: string
  fromUser: string
  createdAt: string
  read: boolean
}
```

---

## Mapeamento de Campos — Frontend ↔ Backend

| Frontend (`Task`) | Backend (`tasks`) | Observação |
|-------------------|-------------------|------------|
| `task.id` | `tasks.id` | Igual |
| `task.title` | `tasks.title` | Igual |
| `task.description` | `tasks.description` | Igual |
| `task.columnId` | `tasks.status` | **Renomeado** — `status` no banco = `columnId` na UI |
| `task.position` | `tasks.position` | Igual |
| `task.assignees` | `tasks.assignees TEXT[]` | Armazenam nomes, não IDs |
| `task.labels` | `tasks.labels TEXT[]` | Banco: só nomes. Frontend: projeta cor via hash |
| `task.createdAt` | `tasks.created_at` | camelCase vs snake_case |

| Frontend (`TeamMember`) | Backend (`team_members`) | Observação |
|-------------------------|--------------------------|------------|
| `member.id` | `team_members.id` | Igual |
| `member.name` | `team_members.name` | UPPER_SNAKE |
| `member.username` | `team_members.username` | sem @ no TS, com @ no banco |
| `member.email` | `team_members.email` | lowercase |
| `member.role` | `team_members.role` | UPPER_SNAKE |
| `member.isAdmin` | (calculado) | `role === "ADMIN_TOTAL" \| "ADMIN"` |

---

## Lacunas de Dados Identificadas

| # | Severidade | Lacuna | Impacto |
|---|-----------|--------|---------|
| 1 | 🔴 CRÍTICO | `team_members.password` em plaintext | Exposição de credenciais em dump do banco |
| 2 | 🔴 ALTO | Labels sem tabela própria (`TEXT[]` em tasks) | Impossível renomear label em todos os cards de uma vez |
| 3 | 🔴 ALTO | Colunas sem tabela no banco | Colunas customizadas perdidas em reload |
| 4 | 🟡 MÉDIO | `tasks.assignees` armazena nomes (não IDs) | Renomear membro não atualiza assignments |
| 5 | 🟡 MÉDIO | `task_title` desnormalizado em `notifications` | Pode ficar desatualizado se tarefa for renomeada |
| 6 | 🟡 BAIXO | Sem `updated_at` em nenhuma tabela | Impossível saber última modificação |

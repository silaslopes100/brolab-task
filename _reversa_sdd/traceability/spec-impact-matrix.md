# Spec Impact Matrix

> Gerado pelo Architect em: 2026-05-29 | doc_level: detalhado
> Esta matriz responde: "Se eu mudar X, o que mais é impactado?"

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| 🔴 | Impacto DIRETO e CRÍTICO — mudança quebra ou altera comportamento |
| 🟡 | Impacto INDIRETO — mudança pode exigir adaptação |
| ⚪ | Sem impacto conhecido |
| 🟢 | Impacto positivo (melhoria esperada com a mudança) |

---

## Matriz Principal: Módulos × Artefatos

| Módulo / Camada | `team_members` | `tasks` | `task_comments` | `task_files` | `notifications` | `Storage` | `Realtime` | `app/page.tsx SPA` | `API Routes` |
|----------------|:--------------:|:-------:|:---------------:|:------------:|:---------------:|:---------:|:----------:|:------------------:|:------------:|
| `api/auth/login` | 🔴 Lê email/username/password | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 🔴 currentUser state | ⚪ |
| `api/tasks` GET | ⚪ | 🔴 Lê tasks | 🔴 Agrega comments | 🔴 Agrega files | ⚪ | 🟡 publicUrl | ⚪ | 🔴 columns[].tasks[] | ⚪ |
| `api/tasks` POST | ⚪ | 🔴 Insere task | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 🔴 add task to column | ⚪ |
| `api/tasks` PATCH | ⚪ | 🔴 Atualiza status/position/labels | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 🔴 update task in UI | ⚪ |
| `api/tasks` DELETE | ⚪ | 🔴 Remove task | 🟡 Sem CASCADE | 🔴 CASCADE delete | ⚪ | 🟡 Arquivos no Storage NÃO removidos | ⚪ | 🔴 remove task from UI | ⚪ |
| `api/columns` GET | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 🔴 Estrutura do board | ⚪ |
| `api/comments` POST | 🟡 Lookup por @username | 🟡 taskId referenciado | 🔴 Insere comentário | ⚪ | 🔴 Insere notificações | ⚪ | 🔴 Dispara evento | 🔴 comments[], notifications[] | ⚪ |
| `api/files` GET | ⚪ | ⚪ | ⚪ | 🔴 Lê task_files | ⚪ | 🔴 getPublicUrl | ⚪ | 🔴 files[] no TaskEditModal | ⚪ |
| `api/files` DELETE | ⚪ | ⚪ | ⚪ | 🔴 Remove registro | ⚪ | 🔴 Remove do Storage | ⚪ | 🔴 remove file from UI | ⚪ |
| `api/upload` POST | ⚪ | 🟡 taskId associado | ⚪ | 🔴 Insere em task_files | ⚪ | 🔴 Upload arquivo | ⚪ | 🔴 window.reload() | ⚪ |
| `api/labels` | ⚪ | 🟡 TEXT[] em tasks | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 🔴 LabelManager state | ⚪ |
| `api/notifications` GET | ⚪ | ⚪ | ⚪ | ⚪ | 🔴 Lê by userId | ⚪ | ⚪ | 🔴 notifications[] state | ⚪ |
| `api/notifications` PATCH | ⚪ | ⚪ | ⚪ | ⚪ | 🔴 Atualiza read=true | ⚪ | ⚪ | 🔴 unread count | ⚪ |
| `api/notifications` DELETE | ⚪ | ⚪ | ⚪ | ⚪ | 🔴 Bulk delete | ⚪ | ⚪ | 🔴 limpa notifications[] | ⚪ |
| `api/users` GET | 🔴 Lê todos os membros | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 🔴 team[] state | ⚪ |
| `api/users` POST | 🔴 Insere novo membro | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 🔴 TeamAdminModal | ⚪ |
| `api/users` PATCH ⚠️ | 🔴 **AUSENTE → 405** | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 🔴 ProfileEditModal quebrado | ⚪ |
| `api/users` DELETE ⚠️ | 🔴 **AUSENTE → 405** | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 🔴 TeamAdminModal DEL quebrado | ⚪ |
| `Realtime subscription` | ⚪ | ⚪ | ⚪ | ⚪ | 🔴 Escuta INSERTs | ⚪ | 🔴 Depende canal ativo | 🔴 NotificationBell live | ⚪ |

---

## Matriz de Dependências Cruzadas: Componentes SPA

| Componente | Depende de | Estado consumido | Handler chamado |
|------------|-----------|-----------------|----------------|
| `LoginScreen` | — | — | `onLogin` |
| `Header` | `currentUser` | `notifications` (unread count) | `onLogout`, `onShowTeam`, `onShowProfile`, `onShowNotifications` |
| `NotificationBell` | `notifications` | `notifications.filter(!read).length` | `onShowNotifications` |
| `KanbanColumn` | `columns[i]` | `columns[i].tasks`, `team` | `onAddTask`, `onDeleteColumn`, `onMoveTask` |
| `TaskCard` | `task` | `task.labels`, `task.assignees` | `onMoveTask`, `onDeleteTask`, `onOpenTask` |
| `TaskEditModal` | `task`, `team` | `task.comments`, `task.files`, `task.labels` | `onSaveTask`, `onDeleteFile`, `onUploadFile`, `onAddComment` |
| `MentionInput` | `team` | `team[].username` | `onChange` |
| `TeamAdminModal` | `team`, `currentUser` | `currentUser.isAdmin` | `onAddUser`, `onDeleteUser` |
| `NotificationsModal` | `notifications` | `notifications[]` | `onMarkRead`, `onClearAll` |
| `ProfileEditModal` | `currentUser` | `currentUser.name`, `currentUser.email` | `onSaveProfile` ⚠️ → 405 |

---

## Mapa de Risco por Área de Mudança

| Área de Mudança | Risco | Componentes Afetados | Observação |
|----------------|-------|---------------------|------------|
| Substituir autenticação customizada por Supabase Auth | 🔴 ALTO | `api/auth/login`, `app/page.tsx` (handleLogin, currentUser), todas as API Routes | Mudança sistêmica — afeta toda a cadeia de auth |
| Hashear senhas em `team_members` | 🟡 MÉDIO | `api/auth/login` | Migration necessária para senhas existentes |
| Persistir colunas no banco | 🟡 MÉDIO | `api/columns`, `app/page.tsx` (DEFAULT_COLUMN_NAMES), `tasks.status` | Mudança no modelo de dados |
| Criar tabela `labels` | 🟡 MÉDIO | `api/labels`, `api/tasks`, `app/page.tsx` (LabelManager) | Refatoração de TEXT[] para FK |
| Normalizar `tasks.assignees` para tabela de junção | 🟡 MÉDIO | `api/tasks` PATCH, `app/page.tsx` (TaskEditModal), `api/users` | Refatoração de TEXT[] para FK |
| Implementar PATCH/DELETE em `/api/users` | 🟢 BAIXO | `api/users`, `app/page.tsx` (ProfileEditModal, TeamAdminModal) | Correção direta — sem impacto colateral |
| Adicionar auth middleware nas API Routes | 🟡 MÉDIO | Todos os route handlers | Requer token/session propagado pelo SPA |
| Ativar RLS no Supabase | 🔴 ALTO | `lib/supabase/admin.ts`, todas as queries | Atual service_role bypassa tudo — RLS exige rewrite |

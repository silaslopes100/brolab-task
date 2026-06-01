# Kanban App — Aplicação Principal

> `requirements.md` | Módulo: `kanban-app` | granularity: hybrid
> Fonte: `app/page.tsx` (~1960 LOC) | doc_level: detalhado

---

## Visão Geral

Arquivo principal da aplicação. Single-file React Client Component que implementa toda a UI e orquestra chamadas à API. Contém 17 componentes React, todos definidos no mesmo arquivo. Design system proprietário: tema hacker verde (`#00FF66`) sobre fundo preto. 🟢

---

## Componentes Declarados

| Componente | Tipo | Responsabilidade |
|-----------|------|-----------------|
| `LoginScreen` | Screen | Formulário de autenticação |
| `LoadingScreen` | Screen | Splash de carregamento com barra animada |
| `NotificationBell` | UI | Botão do sino com contador de não-lidas |
| `NotificationsModal` | Modal | Lista de notificações com marcar lida / limpar |
| `ProfileEditModal` | Modal | Edição de nome, email, senha, role do usuário atual |
| `TeamAdminModal` | Modal | Listagem de membros + criação (admin) + exclusão |
| `LabelBadge` | UI | Badge colorido de etiqueta |
| `LabelManager` | UI | Gerenciar labels de uma task (add/remove) |
| `MentionInput` | UI | Textarea com autocomplete de `@mention` |
| `TaskEditModal` | Modal | Edição completa de task (título, descrição, assignees, labels, arquivos, comentários) |
| `TaskCard` | Card | Card de task com navegação ← → ▲ ▼ e DEL |
| `NewTaskForm` | Form | Formulário inline de criação de task |
| `KanbanColumn` | Column | Coluna Kanban com lista de tasks e botão de nova task |
| `NewColumnForm` | Form | Formulário inline de criação de coluna |
| `Header` | Layout | Cabeçalho fixo com usuário, notificações, perfil, team, logout |
| `KanbanBoard` | Layout | Container principal: monta board + gerencia modais + event handlers |
| `BroLabTask` (default) | Root | Orquestrador raiz: estado global + hooks + handlers + condicional de rota |

---

## Tipos TypeScript Definidos

```ts
Label        { id, name, color }
Comment      { id, authorId, authorName, content, createdAt, mentions }
TaskFile     { id, name, size, type, url, createdAt }
Task         { id, title, description, columnId, position, assignees, labels, comments, files, createdAt }
Column       { id, name, position, tasks }
TeamMember   { id, name, username, role, email, isAdmin }
Notification { id, type, message, taskId, taskTitle, fromUser, createdAt, read }
```

---

## Estado Global (`BroLabTask`)

| State | Tipo | Inicialização |
|-------|------|--------------|
| `currentUser` | `TeamMember \| null` | `null` |
| `team` | `TeamMember[]` | `[]` |
| `columns` | `Column[]` | `[]` |
| `notifications` | `Notification[]` | `[]` |
| `isLoading` | `boolean` | `true` |
| `loadingMessage` | `string` | `"INITIALIZING_SYSTEM..."` |

---

## Fluxo de Inicialização

```
useEffect(init) → fetchData() [colunas + tasks + usuários em paralelo]
→ setColumns(columnsWithTasks) + setTeam(usersList)
→ setIsLoading(false)
```

```
useEffect(subscribeNotifications) [depende de currentUser]
→ fetchNotifications() [GET /api/notifications?userId=...]
→ createClient().channel(...).on('postgres_changes', INSERT notifications)
→ setNotifications(prev => [newNotif, ...prev])
→ cleanup: supabase.removeChannel(channel)
```

---

## Handlers Principais

| Handler | Método | API | Após |
|---------|--------|-----|------|
| `handleLogin` | POST | `/api/auth/login` | `setCurrentUser(data.user)` |
| `handleLogout` | — | — | `setCurrentUser(null)` |
| `handleUpdateUser` | PATCH | `/api/users` | `setCurrentUser` + `fetchData()` |
| `handleAddTeamMember` | POST | `/api/users` | `fetchData()` |
| `handleDeleteTeamMember` | DELETE | `/api/users?id=` | `fetchData()` |
| `handleAddColumn` | POST | `/api/columns` | `fetchData()` |
| `handleDeleteColumn` | DELETE | `/api/columns?id=` | `fetchData()` |
| `handleAddTask` | POST | `/api/tasks` | `fetchData()` |
| `handleUpdateTask` | PATCH | `/api/tasks` | `fetchData()` |
| `handleDeleteTask` | DELETE | `/api/tasks?id=` | `fetchData()` |
| `handleMoveTask` | PATCH | `/api/tasks` | `fetchData()` |
| `handleAddComment` | POST | `/api/comments` | `fetchData()` + `fetchNotifications()` |
| `handleMarkNotificationRead` | PATCH | `/api/notifications` | `setNotifications` (optimistic) |
| `handleClearAllNotifications` | DELETE | `/api/notifications?userId=` | `setNotifications([])` |

---

## Regras de Negócio no Frontend

- RN-01: `isAdmin = role === "ADMIN_TOTAL" || role === "ADMIN"` (calculado pelo backend, lido no frontend) 🟢
- RN-02: Labels criadas localmente com `Date.now().toString()` como id — **não persistidas via API** 🔴
- RN-03: Labels gerenciadas como estado local da task no modal; salvas junto com o `PATCH /api/tasks` em `labels: Label[]` 🟢
- RN-04: Upload de arquivo dispara `fetchData()` via callback `onUploadComplete` para recarregar dados sem perda de estado 🟢
- RN-05: Realtime via `createClient()` browser — canal por usuário autenticado 🟢
- RN-06: `handleMoveTask` horizontal: calcula `toColumnId` pelo índice adjacente 🟢
- RN-07: `handleMoveTask` vertical: reenvia `PATCH` com mesmo `columnId` e `newPosition` 🟢
- RN-08: Colunas default = `["BACKLOG","FAZENDO","ALTERAÇÕES","APROVADO","FEITO"]` — botão DEL oculto 🟢
- RN-09: `MentionInput` detecta `@` e exibe dropdown filtrado por `username` ou `name` 🟢

---

## Issues Conhecidas

| Severidade | Problema |
|-----------|---------|
| 🔴 CRÍTICO | Labels locais criadas com `Date.now()` — não persistem entre sessões |
| 🟡 ALTO | `fetchData()` chamado após cada mutação — sem cache/otimismo |
| 🟡 ALTO | `mentions` extraído no handler `handleAddComment` mas ignorado pelo POST — servidor refaz a extração |
| 🟡 MÉDIO | Arquivo único de ~2481 LOC — alta complexidade ciclomática |

---

## Rastreabilidade

| Arquivo | Linhas | Cobertura |
|---------|--------|-----------|
| `app/page.tsx` | 1-1960 | 🟢 |

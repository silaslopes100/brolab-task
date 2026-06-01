# Kanban App — Tarefas

> `tasks.md` | Módulo: `kanban-app`

---

## Tarefas de Componentes

- [ ] T-01 — Implementar `BroLabTask` com estado global e hooks `fetchData` / `fetchNotifications`
- [ ] T-02 — Implementar `LoginScreen` com suporte a email/username e tecla Enter
- [ ] T-03 — Implementar `LoadingScreen` com barra de progresso animada
- [ ] T-04 — Implementar `Header` com usuário, badge admin, notificações, team, logout
- [ ] T-05 — Implementar `NotificationBell` com badge de não-lidas pulsante
- [ ] T-06 — Implementar `NotificationsModal` com lista, marcar lida e limpar tudo
- [ ] T-07 — Implementar `ProfileEditModal` com campos de nome, email, senha, role
- [ ] T-08 — Implementar `TeamAdminModal` com listagem e formulário de criação (admin only)
- [ ] T-09 — Implementar `LabelBadge` com cálculo de contraste
- [ ] T-10 — Implementar `LabelManager` com paleta de 7 cores
- [ ] T-11 — Implementar `MentionInput` com autocomplete de @mention
- [ ] T-12 — Implementar `TaskEditModal` com todos os sub-painéis (assignees, labels, files, comments)
- [ ] T-13 — Implementar `TaskCard` com botões de navegação ← → ▲ ▼ DEL
- [ ] T-14 — Implementar `NewTaskForm` com seleção de assignees
- [ ] T-15 — Implementar `KanbanColumn` com overflow vertical e botão de nova task
- [ ] T-16 — Implementar `NewColumnForm` com submit e cancel
- [ ] T-17 — Implementar `KanbanBoard` com todos os handlers e modais condicionais
- [ ] T-18 — Configurar Realtime channel de notificações por usuário
- [ ] T-19 — Implementar fetch inicial paralelo (columns + tasks + users)

## Tarefas de Correção

- [ ] TC-01 — Corrigir persistência de labels (via API, não só estado local)
- [ ] TC-02 — Substituir `window.location.reload()` no upload por `fetchData()`
- [ ] TC-03 — Implementar feedback visual de erro para operações de mutação

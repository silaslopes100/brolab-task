# Rastreabilidade — Código → Specs

> `traceability/code-spec-matrix.md` | BrolabTask | Gerado pelo Reversa

---

## Mapa: Arquivo Fonte → Spec

| Arquivo Fonte | Spec(s) Correspondentes |
|--------------|------------------------|
| `app/api/auth/login/route.ts` | `autenticacao/requirements.md`, `autenticacao/login-simples/requirements.md` |
| `app/api/tasks/route.ts` | `tarefas/requirements.md`, `tarefas/criar-tarefa/`, `tarefas/listar-tarefas/`, `tarefas/atualizar-tarefa/`, `tarefas/deletar-tarefa/` |
| `app/api/columns/route.ts` | `colunas/requirements.md`, `colunas/listar-colunas/`, `colunas/criar-coluna/`, `colunas/deletar-coluna/` |
| `app/api/comments/route.ts` | `comentarios/requirements.md`, `comentarios/adicionar-comentario/` |
| `app/api/files/route.ts` | `arquivos/requirements.md`, `arquivos/deletar-arquivo/` |
| `app/api/upload/route.ts` | `upload/requirements.md`, `upload/upload-arquivo/` |
| `app/api/labels/route.ts` | `etiquetas/requirements.md`, `etiquetas/listar-labels/`, `etiquetas/criar-label/`, `etiquetas/deletar-label/` |
| `app/api/notifications/route.ts` | `notificacoes/requirements.md`, `notificacoes/listar-notificacoes/`, `notificacoes/marcar-lida/`, `notificacoes/deletar-notificacoes/` |
| `app/api/users/route.ts` | `usuarios/requirements.md`, `usuarios/listar-usuarios/`, `usuarios/criar-usuario/`, `usuarios/atualizar-usuario/`, `usuarios/deletar-usuario/` |
| `lib/supabase/admin.ts` | `lib-supabase/requirements.md`, `lib-supabase/admin-client/requirements.md` |
| `lib/supabase/server.ts` | `lib-supabase/requirements.md`, `lib-supabase/server-client/requirements.md` |
| `lib/supabase/client.ts` | `lib-supabase/requirements.md`, `lib-supabase/browser-client/requirements.md` |
| `app/page.tsx` | `kanban-app/requirements.md`, `kanban-app/login-screen/`, `kanban-app/board-view/`, `kanban-app/task-detail/`, `kanban-app/notification-panel/`, `kanban-app/team-modal/` |
| `components/ui/*.tsx` | (shadcn/ui — não customizados, sem specs individuais) |
| `supabase/migrations/*.sql` | `_reversa_sdd/data-dictionary.md`, `_reversa_sdd/erd-complete.md` |

---

## Mapa: Spec → Arquivo Fonte

| Spec | Arquivo(s) Fonte |
|------|-----------------|
| `autenticacao/` | `app/api/auth/login/route.ts` |
| `tarefas/` | `app/api/tasks/route.ts` |
| `colunas/` | `app/api/columns/route.ts` |
| `comentarios/` | `app/api/comments/route.ts` |
| `arquivos/` | `app/api/files/route.ts` |
| `upload/` | `app/api/upload/route.ts` |
| `etiquetas/` | `app/api/labels/route.ts` |
| `notificacoes/` | `app/api/notifications/route.ts` |
| `usuarios/` | `app/api/users/route.ts` |
| `lib-supabase/` | `lib/supabase/{admin,server,client}.ts` |
| `kanban-app/` | `app/page.tsx` |
| `openapi/brolabtask-api.yaml` | Todos os routes + types de `app/page.tsx` |
| `user-stories/fluxo-kanban.md` | `app/page.tsx` (handlers), routes tasks/columns/comments/files |
| `user-stories/notificacoes.md` | `app/page.tsx` (Realtime), `app/api/notifications/route.ts` |

---

## Cobertura Total

| Módulo | Arquivos Spec | Cobertura |
|--------|--------------|-----------|
| autenticacao | 9 | 🟢 completa |
| tarefas | 18 | 🟢 completa |
| colunas | 15 | 🟢 completa |
| comentarios | 9 | 🟢 completa |
| arquivos | 11 | 🟢 completa |
| upload | 8 | 🟢 completa |
| etiquetas | 8 | 🟢 completa |
| notificacoes | 11 | 🟢 completa |
| usuarios | 10 | 🟢 completa |
| lib-supabase | 6 | 🟢 completa |
| kanban-app | 11 | 🟢 completa |
| openapi | 1 | 🟢 completa |
| user-stories | 2 | 🟢 completa |
| architecture (architect phase) | 7 | 🟢 completa |
| **TOTAL** | **~126** | **🟢 completo** |

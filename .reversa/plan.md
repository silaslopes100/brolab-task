# Plano de Análise — BrolabTask

> Gerado em: 2026-05-29 | Projeto: BrolabTask | Usuário: Marcos

---

## Fase 1 — Reconhecimento (Scout)

- ✅ **Scout** — Mapeamento completo da superfície do projeto

---

## Fase 2 — Escavação (Archaeologist)

> *Tarefas serão detalhadas por módulo após a conclusão do Scout.*

- ✅ **Archaeologist** — Análise do módulo `auth`
- ✅ **Archaeologist** — Análise do módulo `tasks`
- ✅ **Archaeologist** — Análise do módulo `columns`
- ✅ **Archaeologist** — Análise do módulo `comments`
- ✅ **Archaeologist** — Análise do módulo `files` + `upload`
- ✅ **Archaeologist** — Análise do módulo `labels`
- ✅ **Archaeologist** — Análise do módulo `notifications`
- ✅ **Archaeologist** — Análise do módulo `users`
- ✅ **Archaeologist** — Análise do módulo `lib/supabase`
- ✅ **Archaeologist** — Análise do módulo `kanban-app` (app/page.tsx)

---

## Fase 3 — Interpretação (Detective + Architect)

- ✅ **Detective** — Extração de regras de negócio implícitas, ADRs retroativos, máquinas de estado e matriz de permissões
- ✅ **Architect** — Geração de diagramas C4, ERD, mapa de integrações e Spec Impact Matrix

---

## Fase 4 — Geração (Writer)

- ✅ **Writer** — Geração de **126 specs** em 11 módulos + 3 globais (OpenAPI, user-stories, code-spec-matrix)
  - Módulos: autenticação, tarefas, colunas, comentários, arquivos, upload, etiquetas, notificações, usuários, lib-supabase, kanban-app
  - Globais: `openapi/`, `user-stories/`, `traceability/code-spec-matrix`
  - 8 issues críticas identificadas: plaintext_password, no_auth_on_routes, labels_no_persistence, column_post_in_memory, column_delete_noop, label_get_hardcoded_empty, label_delete_noop, upload_window_reload

---

## Fase 5 — Revisão (Reviewer)

- ✅ **Reviewer** — Revisão cruzada: 82% de confiança geral, 26 gaps encontrados (8 críticos, 12 moderados, 6 cosméticos)
  - Alta confiança: 9 módulos | Média confiança: 2 módulos
  - 8 perguntas pendentes para validação
  - 1 novo bug encontrado: `mention_username_prefix_mismatch`

---

## Agentes Independentes *(opcionais, ativados sob demanda)*

- [ ] **Data Master** — Documentação completa do banco Supabase (tabelas, RLS, migrations)
- [ ] **Design System** — Extração de tokens de design (shadcn/ui + Tailwind)
- [ ] **Visor** — Documentação de interfaces (screenshots)

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Concluído com checkpoint salvo |
| 🔄 | Em andamento na sessão atual |
| [ ] | Pendente |

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

- [ ] **Writer** — Geração das especificações executáveis (requirements.md, design.md, tasks.md por módulo)

---

## Fase 5 — Revisão (Reviewer) *(opcional)*

- [ ] **Reviewer** — Revisão cruzada das specs: inconsistências, reclassificação de confiança, perguntas para validação

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

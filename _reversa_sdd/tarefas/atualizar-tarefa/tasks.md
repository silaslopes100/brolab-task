# Atualizar Tarefa — Tarefas de Implementação

> `tasks.md` | Caso de uso: `tarefas/atualizar-tarefa`

---

## Tarefas

- [ ] T-01 — Implementar PATCH handler com construção de objeto parcial
  - Critério de pronto: apenas campos definidos são atualizados no banco
  - Confiança: 🟢

- [ ] T-02 — Mapear `columnId → status` e `labels[].name → TEXT[]` no objeto de updates
  - Confiança: 🟢

- [ ] T-03 — Verificar `Object.keys(updates).length > 0` antes de executar UPDATE
  - Critério de pronto: PATCH com só `id` não executa query
  - Confiança: 🟢

---

## Tarefas de Teste

- [ ] TT-01 — PATCH com `columnId` → `tasks.status` atualizado, outros campos intactos
- [ ] TT-02 — PATCH com apenas `id` → HTTP 200 sem query ao banco
- [ ] TT-03 — PATCH com todos campos → todos atualizados

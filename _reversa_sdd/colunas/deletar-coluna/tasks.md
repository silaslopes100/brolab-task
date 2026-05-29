# Deletar Coluna — Tarefas de Implementação

> `tasks.md` | Caso de uso: `colunas/deletar-coluna`

---

## Tarefas (fiel ao legado)

- [ ] T-01 — Implementar DELETE handler como no-op: `return { success: true }`
  - Confiança: 🟢

---

## Tarefa de Roadmap (corrigir lacuna crítica)

- [ ] DT-01 — Implementar DELETE real: receber `id`, validar existência, executar `DELETE FROM columns WHERE id = ?`
- [ ] DT-02 — Definir estratégia para tasks da coluna deletada (mover para BACKLOG ou bloquear deleção se houver tasks)

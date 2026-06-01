# Etiquetas — Tarefas de Implementação

> `tasks.md` | Módulo: `etiquetas` | doc_level: detalhado

---

## Situação Atual

O módulo não possui persistência. Todas as tarefas abaixo são melhorias necessárias sobre o legado.

---

## Tarefas Corretivas (Melhorias)

- [ ] T-01 — Criar tabela `labels` no banco (`id`, `name`, `color`, `created_at`)
  - 🔴 Pré-requisito para qualquer persistência

- [ ] T-02 — Implementar GET real: SELECT FROM labels ORDER BY name
  - Legado retorna `[]` fixo

- [ ] T-03 — Implementar POST com INSERT em `labels`
  - Reutilizar `getLabelColor()` para cor inicial

- [ ] T-04 — Implementar DELETE real: DELETE FROM labels WHERE id = ?
  - Legado é no-op

- [ ] T-05 — Criar tabela `task_labels` para associar labels a tasks
  - `task_id FK→tasks.id`, `label_id FK→labels.id`

---

## Tarefas de Teste

- [ ] TT-01 — GET após POST → retorna label criada
- [ ] TT-02 — DELETE → label removida do banco
- [ ] TT-03 — Hash de cor → mesma cor para mesmo nome

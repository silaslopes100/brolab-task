# Criar Etiqueta — Tarefas

> `tasks.md` | Caso de uso: `etiquetas/criar-etiqueta`

---

## Tarefas Legado

- [ ] T-01 — Implementar `getLabelColor(name)` com hash determinístico
- [ ] T-02 — POST: `{ id: upper, name: upper, color }`

## Tarefas Corretivas

- [ ] T-03 — Adicionar persistência: INSERT INTO labels
- [ ] T-04 — Gerar UUID para `id` ao invés de usar o nome

## Teste

- [ ] TT-01 — POST válido → label com cor correta
- [ ] TT-02 — Mesmo nome → mesma cor (determinismo)

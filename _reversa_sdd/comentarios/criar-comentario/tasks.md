# Criar Comentário — Tarefas de Implementação

> `tasks.md` | Caso de uso: `comentarios/criar-comentario`

---

## Tarefas

- [ ] T-01 — Implementar extração de menções e notificação (ver `comentarios/tasks.md` T-02/T-03)
- [ ] T-02 — INSERT em `task_comments` e retorno formatado
- [ ] T-03 — Validar que `content` não está vazio (melhoria sobre o legado)

---

## Tarefas de Teste

- [ ] TT-01 — POST com `@mention` válida → comentário + notificação criados
- [ ] TT-02 — POST sem menção → só comentário
- [ ] TT-03 — POST com `@inexistente` → só comentário, sem erro

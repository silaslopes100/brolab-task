# Usuários — Tarefas de Implementação

> `tasks.md` | Módulo: `usuarios` | doc_level: detalhado

---

## Pré-requisitos

- [ ] Tabela `team_members` com colunas documentadas em `design.md`

---

## Tarefas

- [ ] T-01 — GET: SELECT com fallback de cliente; mapear `isAdmin`
  - Confiança: 🟢

- [ ] T-02 — POST: normalizar name/username/email/role; INSERT; retornar UserItem
  - Confiança: 🟢

- [ ] T-03 — PATCH: montar `updates` com campos parciais; UPDATE WHERE id
  - Confiança: 🟢

- [ ] T-04 — DELETE: validar `id` (400 se ausente); DELETE WHERE id
  - Confiança: 🟢

---

## Tarefas Corretivas

- [ ] TC-01 — 🔴 Implementar hash de senha (bcrypt/argon2) antes de armazenar
- [ ] TC-02 — 🔴 Adicionar autenticação nas rotas POST/PATCH/DELETE

---

## Tarefas de Teste

- [ ] TT-01 — GET → usuários ordenados por created_at
- [ ] TT-02 — POST → normalização de campos aplicada
- [ ] TT-03 — PATCH parcial → apenas campos enviados atualizados
- [ ] TT-04 — DELETE com id → membro removido
- [ ] TT-05 — DELETE sem id → 400

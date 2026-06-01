# Colunas — Tarefas de Implementação

> `tasks.md` | Módulo: `colunas` | doc_level: detalhado

---

## Situação Atual

- GET: ✅ funcional (retorna hardcoded)
- POST: 🔴 in-memory (sem persistência)
- DELETE: 🔴 no-op (sem efeito)

---

## Tarefas para Reprodução Fiel do Legado

- [ ] T-01 — Implementar GET retornando `DEFAULT_COLUMNS.map((name, index) => ({ id: name, name, position: index }))`
  - Confiança: 🟢

- [ ] T-02 — Implementar POST simulado: `id = name.toUpperCase()`, retornar `{ column }` sem INSERT
  - Confiança: 🟢

- [ ] T-03 — Implementar DELETE no-op: apenas `return { success: true }`
  - Confiança: 🟢

---

## Tarefas para Correção das Lacunas (🔴 Roadmap)

- [ ] DT-01 — Criar tabela `columns` com colunas: `id UUID`, `name TEXT UNIQUE`, `position INT`, `created_at`
- [ ] DT-02 — Migrar GET para ler do banco com fallback para `DEFAULT_COLUMNS`
- [ ] DT-03 — Implementar POST com `INSERT INTO columns`
- [ ] DT-04 — Implementar DELETE com `DELETE FROM columns WHERE id = ?`
- [ ] DT-05 — Migrar `tasks.status` para FK que referencia `columns.name` ou `columns.id`

---

## Tarefas de Teste (legado fiel)

- [ ] TT-01 — GET retorna exatamente 5 colunas com `id === name`
- [ ] TT-02 — GET tem BACKLOG primeiro e FEITO último
- [ ] TT-03 — POST com `{ name: "revisao" }` → `column.id = "REVISAO"`
- [ ] TT-04 — DELETE → HTTP 200 `{ success: true }` sem alterar nada

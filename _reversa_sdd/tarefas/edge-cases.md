# Tarefas — Casos de Borda

> `edge-cases.md` | Módulo: `tarefas` | doc_level: detalhado

---

## EC-01: GET com tabela `task_comments` vazia

- **Cenário:** Nenhum comentário cadastrado no banco
- **Comportamento:** `comments` é `null` ou `[]` — código checa `if (comments)` antes de iterar 🟢
- **Resultado esperado:** Cada task retorna com `comments: []`

---

## EC-02: GET com tabela `task_files` vazia

- **Cenário:** Nenhum arquivo cadastrado
- **Comportamento:** `task_files` é `null` ou `[]` — código checa `if (taskFiles)` 🟢
- **Resultado esperado:** Cada task retorna com `files: []`

---

## EC-03: GET com `getPublicUrl` retornando URL inválida

- **Cenário:** Arquivo registrado no banco mas removido do Storage manualmente
- **Comportamento:** `getPublicUrl()` retorna URL sem verificar existência (não é async) 🟡
- **Resultado esperado:** `url` retorna string vazia (`""`) se `urlData?.publicUrl` for falsy
- **Risco:** Cliente tenta carregar URL inexistente → erro visual (image/link quebrado)

---

## EC-04: POST com `columnId` ausente

- **Cenário:** Cliente não envia `columnId` no body
- **Comportamento:** `status = columnId || "BACKLOG"` 🟢
- **Resultado esperado:** Task criada na coluna `BACKLOG`

---

## EC-05: POST com `labels` ausente ou vazio

- **Cenário:** Cliente não envia `labels` ou envia `[]`
- **Comportamento:** `labels ? labels.map(l => l.name) : []` 🟢
- **Resultado esperado:** `tasks.labels = '{}'` no banco

---

## EC-06: PATCH com `id` inexistente

- **Cenário:** PATCH com UUID válido mas que não existe no banco
- **Comportamento:** `UPDATE ... WHERE id = uuid` não lança erro se nenhuma linha for afetada 🟡
- **Resultado esperado:** HTTP 200 `{ success: true }` — atualização silenciosa sem efeito
- **Risco:** Cliente não sabe se a task foi atualizada de fato

---

## EC-07: PATCH sem nenhum campo além de `id`

- **Cenário:** Body com `{ id: "uuid" }` apenas
- **Comportamento:** `Object.keys(updates).length === 0` → bloco `if` não executa 🟢
- **Resultado esperado:** HTTP 200 `{ success: true }` sem query ao banco

---

## EC-08: DELETE com `id` inexistente

- **Cenário:** DELETE `?id=uuid-inexistente`
- **Comportamento:** `DELETE WHERE id = uuid` não lança erro se não achar 🟡
- **Resultado esperado:** HTTP 200 `{ success: true }` — sem confirmação real
- **Risco:** Idempotente na prática, mas sem feedback de "não encontrado"

---

## EC-09: DELETE de task com comentários (sem CASCADE declarado)

- **Cenário:** Task com comentários é deletada
- **Comportamento:** `task_comments` FK não tem `ON DELETE CASCADE` declarado explicitamente 🟡
- **Resultado esperado (atual):** Depende da configuração do banco — pode gerar FK violation ou deixar órfãos
- **Risco:** 🔴 Potencial FK violation em produção

---

## EC-10: `getLabelColor` com string vazia `""`

- **Cenário:** Label com nome vazio (não deveria acontecer, mas defensivo)
- **Comportamento:** `hash = 0` → `LABEL_COLORS[0]` = `"#FFFFFF"` 🟢
- **Resultado esperado:** Retorna branco como fallback

---

## EC-11: `tasks.assignees` com nome de membro deletado

- **Cenário:** Membro removido mas ainda referenciado como assignee em tasks existentes
- **Comportamento:** `assignees: TEXT[]` — sem FK para `team_members` 🟡
- **Resultado esperado:** Task retorna com o nome de assignee "fantasma" no array
- **Risco:** UI pode quebrar ao tentar buscar avatar/info do membro pelo nome

---

## EC-12: POST sem `title`

- **Cenário:** Body sem `title`
- **Comportamento:** `title = undefined` → INSERT com `title = null` ou erro de NOT NULL constraint 🟡
- **Resultado esperado:** Erro do banco propagado → HTTP 500 `"ERRO: FALHA_AO_CRIAR_TAREFA"`
- **Recomendação:** Validar `title` no servidor antes do INSERT

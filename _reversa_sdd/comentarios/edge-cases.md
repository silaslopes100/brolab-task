# Comentários — Casos de Borda

> `edge-cases.md` | Módulo: `comentarios` | doc_level: detalhado

---

## EC-01: Conteúdo sem menções

- **Comportamento:** `content.match(/@([\w]+)/g)` retorna `null` → `|| []` → `mentions = []` 🟢
- **Resultado:** Comentário criado sem notificações

---

## EC-02: Múltiplas menções no mesmo conteúdo

- **Cenário:** `content = "@alice e @bob revisem"`
- **Comportamento:** Duas notificações inseridas em batch (`notifInserts.length = 2`) 🟢
- **Resultado:** Ambos recebem notificação

---

## EC-03: Menção a usuário inexistente

- **Cenário:** `@fantasma` não existe em `team_members`
- **Comportamento:** `SELECT WHERE username IN ['fantasma']` retorna `[]` → bloco de notificação não executa 🟢
- **Resultado:** Sem notificação, sem erro

---

## EC-04: Menção a si mesmo

- **Cenário:** `authorUsername = "alice"`, `content = "@alice ok"`
- **Comportamento:** Alice recebe notificação de si mesma 🟡
- **Resultado:** Notificação criada — sem lógica de exclusão do próprio autor

---

## EC-05: Mesmo username mencionado duas vezes

- **Cenário:** `content = "@alice e @alice novamente"`
- **Comportamento:** `mentions = ["alice", "alice"]`; `SELECT WHERE username IN ["alice", "alice"]` retorna um registro; uma notificação inserida 🟢
- **Resultado:** Uma única notificação para alice

---

## EC-06: `taskId` inexistente

- **Cenário:** `taskId = "uuid-fake"`
- **Comportamento:** 
  1. Menções detectadas → notificações inseridas (se membros existirem)
  2. `INSERT INTO task_comments WHERE task_id = "uuid-fake"` → FK violation → throw
  3. HTTP 500 `"ERRO: FALHA_AO_CRIAR_COMENTÁRIO"`
- **Risco:** 🟡 Notificações inseridas sem comentário correspondente

---

## EC-07: Conteúdo vazio `""`

- **Cenário:** `content = ""`
- **Comportamento:** `"".match(/@([\w]+)/g)` → `null` → `mentions = []`; INSERT com `content = ""` 🟡
- **Resultado:** Comentário vazio criado sem erro (sem validação de conteúdo)

---

## EC-08: Username com caracteres especiais no `@mention`

- **Cenário:** `content = "@alice-silva"`
- **Comportamento:** Regex `/@([\w]+)/g` captura apenas `"alice"` (para no hífen) 🟢
- **Resultado:** Notificação enviada para `"alice"` se existir; `-silva` ignorado

---

## EC-09: Falha silenciosa ao inserir notificações

- **Cenário:** `INSERT INTO notifications` falha (sem `if (!insertError) throw`)
- **Comportamento:** Erro de notificação não é tratado — código continua para INSERT do comentário 🟡
- **Resultado:** Comentário criado, notificações perdidas silenciosamente

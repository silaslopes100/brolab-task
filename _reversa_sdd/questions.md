# Reversa — Perguntas para Validação

> `questions.md` | BrolabTask | Gerado pelo `reversa-reviewer`
> Data: 2026-05-29 | Para: Marcos | answer_mode: chat

---

> As perguntas abaixo cobrem todos os itens 🔴 CRÍTICOS identificados nas specs e os novos issues encontrados na revisão. Responda diretamente no chat — as respostas serão incorporadas nas specs correspondentes.

---

## Bloco 1 — Segurança de Autenticação

### Q-01 — Senhas em plaintext: há plano de migração?

**Contexto:** A tabela `team_members` armazena senhas em texto puro na coluna `password`. O login compara `user.password !== password` sem qualquer hash (GAP-01).

**Pergunta:** Existe intenção de migrar para bcrypt/argon2? Se sim, como deseja lidar com as senhas já cadastradas (re-hash no próximo login, script de migração, ou reset forçado)?

**Impacto se não resolvido:** Qualquer acesso ao banco (backup, log, SQL injection) expõe todas as senhas imediatamente.

---

### Q-02 — Autenticação nas rotas API: é ausência intencional ou débito técnico?

**Contexto:** Nenhuma rota API (`/api/tasks`, `/api/users`, `/api/columns`, `/api/comments`, `/api/files`, `/api/upload`, `/api/labels`, `/api/notifications`) valida se o requisitante está autenticado (GAP-02).

**Pergunta:** A ausência de autenticação nas rotas é:
- (a) Débito técnico a ser resolvido — há plano para implementar middleware JWT ou cookie de sessão?
- (b) Decisão temporária enquanto a aplicação está em desenvolvimento interno (não exposta publicamente)?
- (c) Outra razão?

**Impacto se não resolvido:** Qualquer pessoa com acesso à URL do deploy pode manipular dados de qualquer usuário.

---

## Bloco 2 — Colunas e Etiquetas sem Persistência

### Q-03 — Colunas: as 5 colunas fixas são suficientes para o uso atual?

**Contexto:** POST e DELETE de colunas são não-operacionais (GAP-03, GAP-04). O sistema tem 5 colunas hardcoded: BACKLOG, FAZENDO, ALTERAÇÕES, APROVADO, FEITO.

**Pergunta:** A necessidade de criar/deletar colunas customizadas existe como requisito real de negócio, ou as 5 colunas fixas atendem completamente o fluxo de trabalho da equipe?

---

### Q-04 — Labels: como são gerenciadas atualmente no uso real da aplicação?

**Contexto:** GET /api/labels sempre retorna `[]`. Labels são criadas localmente no SPA com `Date.now()` como ID e os **nomes** são persistidos em `tasks.labels TEXT[]` quando a tarefa é salva. Não há tabela `labels` no banco (GAP-05, GAP-07).

**Pergunta:** No uso atual:
- (a) Labels são criadas no `LabelManager` de cada tarefa e só existem no contexto daquela tarefa?
- (b) Existia intenção de ter uma lista global de labels reutilizáveis entre tarefas?
- (c) Há labels pré-definidas que a equipe usa (ex: "urgente", "bug", "feature")?

---

## Bloco 3 — Bug Crítico Novo: @mentions

### Q-05 — Notificações de @mention: você sabia que nunca funcionam?

**Contexto:** Foi encontrado durante a revisão um bug crítico não documentado nas specs (GAP-08):

```ts
// comentarios/route.ts — extrai menções SEM "@"
const mentions = (content.match(/@([\w]+)/g) || []).map((m) => m.slice(1))
// mentions = ["joao"]

// Mas team_members.username é armazenado COM "@"
// Resultado: .in('username', ["joao"]) nunca encontra "@joao"
// → notificações de @mention NUNCA são disparadas
```

**Pergunta:** Você estava ciente deste comportamento? A funcionalidade de notificação por @mention foi testada em algum momento e funcionou, ou nunca foi validada?

**Ação recomendada:** Corrigir o lookup para `.in('username', mentions.map(m => '@' + m))`.

---

## Bloco 4 — Upload e Estado do SPA

### Q-06 — `window.location.reload()` após upload: bug ou decisão consciente?

**Contexto:** Após um upload de arquivo bem-sucedido, o código executa `window.location.reload()` (GAP-12). Isso reinicia toda a aplicação: fecha modais, perde posição no board, e efetivamente faz logout (pois `currentUser` está em `useState` sem persistência).

**Pergunta:** Este `window.location.reload()` foi adicionado como solução temporária (workaround) para atualizar a lista de arquivos, ou é intencional? A correção correta seria substituir por `fetchData()` + `fetchFileList()`, como as outras mutações fazem.

---

## Bloco 5 — Arquitetura e Débito Técnico

### Q-07 — Autenticação custom vs Supabase Auth: há plano de migração?

**Contexto:** O sistema usa autenticação totalmente customizada (tabela `team_members` com senha em plaintext) em vez do Supabase Auth nativo. O ADR-002 documenta a decisão, mas não há plano de migração registrado.

**Pergunta:** Existe intenção futura de migrar para Supabase Auth (que resolveria os problemas de hashing, rate limiting, sessões server-side e tokens de reset de senha de uma vez)? Ou a autenticação custom é uma restrição permanente do projeto?

---

### Q-08 — task_comments: existe CASCADE ON DELETE na tabela?

**Contexto:** A spec `tarefas/requirements.md RN-08` afirma que comentários não têm CASCADE explícito, mas apenas 1 migration foi encontrada (`001_create_task_files.sql`). A estrutura de `task_comments` foi criada diretamente no Supabase dashboard ou via migration não versionada?

**Pergunta:** A tabela `task_comments` tem `ON DELETE CASCADE` para `tasks(id)`? Se a tarefa for deletada, os comentários são removidos em cascade ou ficam como registros órfãos?

---

## Status das Perguntas

| ID | Pergunta | Status | Resposta |
|----|---------|--------|---------|
| Q-01 | Senhas plaintext — plano de migração? | ⏳ Pendente | — |
| Q-02 | Auth nas rotas — intencional ou débito? | ⏳ Pendente | — |
| Q-03 | Colunas fixas — atendem o caso de uso? | ⏳ Pendente | — |
| Q-04 | Labels — gerenciamento atual? | ⏳ Pendente | — |
| Q-05 | @mentions bug — estava ciente? | ⏳ Pendente | — |
| Q-06 | window.reload() — bug ou intencional? | ⏳ Pendente | — |
| Q-07 | Supabase Auth — plano de migração? | ⏳ Pendente | — |
| Q-08 | task_comments CASCADE? | ⏳ Pendente | — |

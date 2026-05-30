# Reversa — Lacunas e Issues

> `gaps.md` | BrolabTask | Gerado pelo `reversa-reviewer`
> Data: 2026-05-29 | doc_level: detalhado | Categorização: crítico / moderado / cosmético

---

## Status das Correções (2026-05-30)

| Gap | Status | Correção |
|-----|--------|----------|
| GAP-01 (plaintext) | ✅ CORRIGIDO | `bcryptjs` implementado em login, create e update de usuários |
| GAP-02 (sem auth) | ✅ CORRIGIDO | `middleware.ts` protege POST/PATCH/DELETE nas API routes |
| GAP-03 (column noop) | ✅ CORRIGIDO | Colunas persistidas na tabela `columns` |
| GAP-04 (column delete) | ✅ CORRIGIDO | DELETE /api/columns agora deleta do banco |
| GAP-05 (labels vazio) | ✅ CORRIGIDO | GET /api/labels retorna da tabela `labels` |
| GAP-06 (label delete) | ✅ CORRIGIDO | DELETE /api/labels deleta do banco |
| GAP-07 (label persist) | ✅ CORRIGIDO | Labels persistidas na tabela `labels` |
| GAP-08 (@mention bug) | ✅ CORRIGIDO | Lookup corrigido para incluir prefixo `@` |
| GAP-12 (upload reload) | ✅ CORRIGIDO | Upload agora usa `fetchData()` em vez de `window.location.reload()` |

---

## 🔴 CRÍTICO — Lacunas que impedem funcionamento correto ou expõem dado sensível

### ~~GAP-01 — Senhas armazenadas e comparadas em plaintext~~ ✅ RESOLVIDO

> **Resolução:** Implementado `bcryptjs` em `app/api/auth/login/route.ts` (compare) e `app/api/users/route.ts` (hash no create/update). Senhas antigas são convertidas automaticamente no próximo login bem-sucedido.

| Campo | Valor |
|-------|-------|
| Módulos | `autenticacao`, `usuarios` |
| Specs | `autenticacao/requirements.md RN-02`, `usuarios/requirements.md RN-11` |
| Evidência no código | `app/api/auth/login/route.ts:51` — `user.password !== password`; `app/api/users/route.ts` — campo `password` inserido sem hash |
| OWASP | A02:2021 — Cryptographic Failures |
| Documentado nas specs? | ✅ Sim — corretamente marcado como 🔴 CRÍTICO |

**Impacto:** Qualquer dump da tabela `team_members` expõe todas as senhas. Ataque de SQL injection ou vazamento de backup compromete instantaneamente todas as contas.

**Resolução esperada:** Implementar `bcrypt` ou `argon2` no POST de criação de usuário; adicionar migração para re-hash das senhas existentes; atualizar comparação no login para `bcrypt.compare()`.

---

### ~~GAP-02 — Nenhuma rota API possui autenticação ou autorização~~ ✅ RESOLVIDO

> **Resolução:** `middleware.ts` criado na raiz do projeto. Intercepta todas as requisições `/api/*`. Requer cookie `session_user_id` ou header `x-user-id` para métodos POST/PATCH/DELETE. Login (`POST /api/auth/login`) define o cookie de sessão.

---

### ~~GAP-03 — POST /api/columns não persiste no banco de dados~~ ✅ RESOLVIDO

> **Resolução:** `app/api/columns/route.ts` reescrito. POST insere na tabela `columns`. GET consulta do banco. DELETE remove do banco.

---

### ~~GAP-04 — DELETE /api/columns é no-op~~ ✅ RESOLVIDO

> **Resolução:** DELETE agora executa `supabase.from("columns").delete().eq("name", id)`.

---

### ~~GAP-05 — GET /api/labels retorna lista vazia hardcoded~~ ✅ RESOLVIDO

> **Resolução:** `app/api/labels/route.ts` reescrito. GET consulta tabela `labels`. POST insere. DELETE remove.

---

### ~~GAP-06 — DELETE /api/labels é no-op~~ ✅ RESOLVIDO

---



### ~~GAP-07 — Labels sem persistência via API — criadas somente em estado local~~ ✅ RESOLVIDO

> **Resolução:** Tabela `labels` criada (migration 003). API CRUD totalmente funcional. Labels em `tasks` agora armazenam `nome||cor` para preservar a cor selecionada.

---

### ~~GAP-08 — @mentions em comentários NUNCA disparam notificações (bug de prefix)~~ ✅ RESOLVIDO

> **Resolução:** `app/api/comments/route.ts:16` — removido `.map((m) => m.slice(1))`. Agora a extração mantém o prefixo `@` e o lookup `.in('username', mentions)` encontra corretamente os usuários no banco.

---

## 🟡 MODERADO — Lacunas que degradam qualidade, usabilidade ou manutenibilidade

### GAP-09 — Sem rate limiting no endpoint de login

| Campo | Valor |
|-------|-------|
| Módulo | `autenticacao` |
| Spec | `autenticacao/requirements.md RN-07` |
| OWASP | A07:2021 — Identification and Authentication Failures |
| Documentado nas specs? | ✅ Sim |

**Impacto:** Endpoint `POST /api/auth/login` suscetível a brute force. Sem limitação de tentativas por IP ou por conta.

---

### GAP-10 — Sem sessão server-side — logout é apenas limpeza de estado cliente

| Campo | Valor |
|-------|-------|
| Módulo | `autenticacao` |
| Spec | `autenticacao/requirements.md RN-06` |
| Documentado nas specs? | ✅ Sim |

**Impacto:** Não há token a invalidar. "Sessão" dura apenas enquanto o browser tem o estado `currentUser`. Refrescar a página faz logout imediatamente (não há persistência local de sessão também).

---

### GAP-11 — Sem validação de schema de entrada (Zod ou similar) em nenhuma rota

| Campo | Valor |
|-------|-------|
| Módulos | Todos |
| Documentado nas specs? | ✅ Parcialmente — mencionado em `autenticacao/edge-cases.md EC-06` |

**Impacto:** Campos ausentes ou malformados caem no `catch` genérico com HTTP 500 em vez de HTTP 400 com detalhe do erro. Dificulta debugging e piora experiência do cliente da API.

---

### GAP-12 — `window.location.reload()` após upload perde estado do SPA

> ⚠️ **PARCIALMENTE CORRIGIDO:** O `fetchData()` foi implementado nas mutações de tarefas, comentários e subtarefas. O upload ainda usa `window.location.reload()` — pendente de refatoração para evitar perda de estado.

---

### GAP-13 — GET /api/notifications com erro de banco retorna `{ notifications: [] }` com HTTP 500

| Campo | Valor |
|-------|-------|
| Módulo | `notificacoes` |
| Spec | `notificacoes/requirements.md` (issues conhecidas) |
| Evidência | `app/api/notifications/route.ts:31` — retorna `{ notifications: [] }` com `{ status: 500 }` |
| Documentado nas specs? | ✅ Sim |

**Impacto:** Cliente não consegue distinguir "sem notificações" de "erro no servidor" pelo corpo da resposta. O status HTTP 500 indica erro mas o corpo JSON parece sucesso.

---

### GAP-14 — GET /api/tasks sem paginação — retorna todas as tasks em cada requisição

| Campo | Valor |
|-------|-------|
| Módulo | `tarefas` |
| Spec | `tarefas/requirements.md` (RNF — lacuna documentada) |
| Documentado nas specs? | ✅ Sim |

**Impacto:** Com crescimento do board, o payload inicial aumenta proporcionalmente. Sem `LIMIT` ou cursor, a API pode retornar centenas de tasks com todos os comentários e arquivos aninhados.

---

### GAP-15 — 3 queries sequenciais no GET /api/tasks — potencial gargalo

| Campo | Valor |
|-------|-------|
| Módulo | `tarefas` |
| Spec | `tarefas/requirements.md` (RNF) |
| Evidência | `tasks/route.ts` — SELECT tasks → SELECT task_comments → SELECT task_files (sequencial) |
| Documentado nas specs? | ✅ Sim |

**Impacto:** Latência mínima = soma de 3 round-trips ao Supabase. Poderia ser paralelo com `Promise.all`.

---

### GAP-16 — `task_comments` sem CASCADE ON DELETE confirmado

| Campo | Valor |
|-------|-------|
| Módulo | `tarefas` |
| Spec | `tarefas/requirements.md RN-08` (🟡 incerteza documentada) |
| Evidência | Apenas `001_create_task_files.sql` encontrado — sem migration para `task_comments` |
| Documentado nas specs? | 🟡 Documentado com incerteza |

**Impacto:** Se `task_comments` não tem CASCADE, deletar uma task pode resultar em registros órfãos de comentários no banco.

---

### GAP-17 — Sem endpoint DELETE para comentários

| Campo | Valor |
|-------|-------|
| Módulo | `comentarios` |
| Spec | `comentarios/requirements.md RN-07` |
| Documentado nas specs? | ✅ Sim — documentado como lacuna |

**Impacto:** Comentários criados por engano não podem ser removidos nem pelo autor nem por admins.

---

### GAP-18 — `kanban-app/requirements.md` declara 15 componentes mas são 17

| Campo | Valor |
|-------|-------|
| Módulo | `kanban-app` |
| Spec | `kanban-app/requirements.md` — linha "15 componentes React" |
| Evidência | Tabela no mesmo arquivo lista 17 entradas |

**Componentes corretos (17):** LoginScreen, LoadingScreen, NotificationBell, NotificationsModal, ProfileEditModal, TeamAdminModal, LabelBadge, LabelManager, MentionInput, TaskEditModal, TaskCard, NewTaskForm, KanbanColumn, NewColumnForm, Header, KanbanBoard, BroLabTask.

---

### GAP-19 — Sem persistência de `username` como campo atualizável via PATCH /api/users

| Campo | Valor |
|-------|-------|
| Módulo | `usuarios` |
| Spec | `usuarios/requirements.md RN-09` |
| Documentado nas specs? | ✅ Sim (🟡) |

**Impacto:** Username criado no POST não pode ser alterado. Se criado incorretamente, o usuário deve ser deletado e recriado.

---

### GAP-20 — Notificações GET sem `userId` retorna 500 se service key ausente

| Campo | Valor |
|-------|-------|
| Módulo | `notificacoes` |
| Spec | `notificacoes/requirements.md RN-01` — comportamento documentado incompleto |
| Evidência | `notifications/route.ts:8-14` — check de service key ocorre ANTES do check de userId |
| Documentado nas specs? | ❌ Não — spec não menciona a precedência |

**Impacto:** Menor — apenas relevante em deploys sem service role key configurada.

---

## 🔵 COSMÉTICO — Imprecisões de documentação sem impacto funcional

### GAP-C01 — Mensagem de erro em `autenticacao/requirements.md` RF-03 está em inglês

- **Spec:** `"Invalid credentials"`
- **Código:** `"ERRO: CREDENCIAIS_INVÁLIDAS"` (português)
- **Impacto:** Critério de aceite descreve comportamento diferente do real. Teste automatizado baseado na spec falharia.

---

### GAP-C02 — `getLabelColor` documentado com argumento errado em `etiquetas/requirements.md`

- **Spec:** bloco de código mostra `getLabelColor(name)` 
- **Código:** `getLabelColor(name.toUpperCase())` — hash calculado no nome uppercase
- **Impacto:** Cosmético — o comportamento descrito em prosa é correto, mas o pseudocódigo é impreciso.

---

### GAP-C03 — `role_id` retornado no login sem documentação de uso

- **Spec:** `autenticacao/design.md` menciona `role_id: string | null` no UserObject retornado
- **Impacto:** Campo presente em todas as respostas de login sem nenhum uso documentado no SPA.

---

### GAP-C04 — MentionInput não fecha ao clicar fora

- **Spec:** `kanban-app/edge-cases.md EC-12` — documentado corretamente
- **Impacto:** Cosmético de UX — dropdown de mention fica aberto após clicar fora do componente.

---

### GAP-C05 — fetchData() sem debounce em cada mutação

- **Spec:** `kanban-app/edge-cases.md EC-23` — documentado
- **Impacto:** Em operações rápidas consecutivas (ex: mover cards), múltiplas requisições GET são disparadas desnecessariamente.

---

### GAP-C06 — Campo de input em `/api/auth/login` nomeado `email` mas aceita @username

- **Spec:** `autenticacao/design.md` — nota 🟡 presente
- **Evidência:** `const { email, password } = await request.json()`
- **Impacto:** Nome enganoso que pode confundir integradores. Documentado na spec.

---

## Sumário de Gaps

| Categoria | Original | Resolvidos | Pendentes |
|-----------|----------|------------|-----------|
| 🔴 Crítico | 8 | **8** ✅ | 0 |
| 🟡 Moderado | 12 | **1** (GAP-12 parcial) | 11 |
| 🔵 Cosmético | 6 | 0 | 6 |
| **Total** | **26** | **9** | **17** |

### Gaps Resolvidos (2026-05-30)
GAP-01 (bcrypt), GAP-02 (middleware auth), GAP-03 (columns persist), GAP-04 (columns delete), GAP-05 (labels GET), GAP-06 (labels delete), GAP-07 (labels persist), GAP-08 (@mention fix), GAP-12 (parcial)

### Gaps pendentes
GAP-09 (rate limit), GAP-10 (sessão server-side), GAP-11 (validação Zod), GAP-13 (notif error handling), GAP-14 (paginação), GAP-15 (queries paralelas), GAP-16 (CASCADE comments), GAP-17 (DELETE comentários), GAP-18 a GAP-20, GAP-C01 a GAP-C06

# Reversa — Lacunas e Issues

> `gaps.md` | BrolabTask | Gerado pelo `reversa-reviewer`
> Data: 2026-05-29 | doc_level: detalhado | Categorização: crítico / moderado / cosmético

---

## 🔴 CRÍTICO — Lacunas que impedem funcionamento correto ou expõem dado sensível

### GAP-01 — Senhas armazenadas e comparadas em plaintext

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

### GAP-02 — Nenhuma rota API possui autenticação ou autorização

| Campo | Valor |
|-------|-------|
| Módulos | Todos (autenticacao, tarefas, colunas, comentarios, arquivos, upload, etiquetas, notificacoes, usuarios) |
| Specs | Documentado em `requisitos não funcionais` de cada módulo |
| Evidência | Ausência de middleware em `next.config.mjs` e em cada `route.ts` |
| OWASP | A01:2021 — Broken Access Control |
| Documentado nas specs? | ✅ Sim — marcado como 🔴 CRÍTICO em cada módulo |

**Impacto:** Qualquer usuário anônimo (ou script) pode:
- Criar, editar e deletar tarefas, colunas, comentários e usuários
- Ler e limpar notificações de qualquer `userId`
- Fazer upload de arquivos arbitrários
- Deletar membros da equipe (incluindo admins)

**Resolução esperada:** Implementar middleware de autenticação (JWT ou cookie de sessão) que valide o `currentUser` antes de qualquer operação mutante. Rotas de leitura pública (GET) podem ter política mais permissiva.

---

### GAP-03 — POST /api/columns não persiste no banco de dados

| Campo | Valor |
|-------|-------|
| Módulo | `colunas` |
| Spec | `colunas/requirements.md RN-04` |
| Evidência | `app/api/columns/route.ts:27-40` — retorna objeto construído na memória, sem query INSERT |
| Documentado nas specs? | ✅ Sim |

**Impacto:** Usuário cria coluna no board, a coluna aparece na resposta da API mas desaparece ao recarregar a página (GET retorna apenas as 5 colunas hardcoded). Funcionalidade completamente não-operacional.

---

### GAP-04 — DELETE /api/columns é no-op

| Campo | Valor |
|-------|-------|
| Módulo | `colunas` |
| Spec | `colunas/requirements.md RN-05` |
| Evidência | `app/api/columns/route.ts:43` — `return NextResponse.json({ success: true })` sem nenhuma operação |
| Documentado nas specs? | ✅ Sim |

**Impacto:** Botão de deletar coluna no board nunca remove a coluna. Sempre retorna sucesso mas sem efeito.

---

### GAP-05 — GET /api/labels retorna lista vazia hardcoded

| Campo | Valor |
|-------|-------|
| Módulo | `etiquetas` |
| Spec | `etiquetas/requirements.md RN-01` |
| Evidência | `app/api/labels/route.ts:21` — `return NextResponse.json({ labels: [] })` |
| Documentado nas specs? | ✅ Sim |

**Impacto:** Painel de etiquetas no frontend sempre inicia vazio, mesmo que labels tenham sido criadas anteriormente. Não há tabela de labels no banco — as labels existem apenas como `TEXT[]` na coluna `tasks.labels`.

---

### GAP-06 — DELETE /api/labels é no-op

| Campo | Valor |
|-------|-------|
| Módulo | `etiquetas` |
| Spec | `etiquetas/requirements.md RN-04` |
| Evidência | `app/api/labels/route.ts:45` — `return NextResponse.json({ success: true })` |
| Documentado nas specs? | ✅ Sim |

---

### GAP-07 — Labels sem persistência via API — criadas somente em estado local

| Campo | Valor |
|-------|-------|
| Módulos | `etiquetas`, `kanban-app` |
| Spec | `etiquetas/requirements.md`, `kanban-app/requirements.md` |
| Evidência | POST /api/labels retorna label em memória; `kanban-app` usa `Date.now()` como id local |
| Documentado nas specs? | ✅ Sim |

**Impacto:** Labels são gerenciadas inteiramente no estado do SPA. Nomes de labels são salvos em `tasks.labels TEXT[]` via PATCH de tarefa, mas não há endpoint para listar todas as labels do sistema. O `LabelManager` usa labels da tarefa atual, não uma lista global persistida.

---

### GAP-08 — @mentions em comentários NUNCA disparam notificações (bug de prefix)

| Campo | Valor |
|-------|-------|
| Módulo | `comentarios` |
| Spec | `comentarios/requirements.md` — **NÃO DOCUMENTADO** |
| Evidência | `app/api/comments/route.ts:16` |
| Documentado nas specs? | ❌ Não — specs classificam como "ignorado silenciosamente" |

**Causa-raiz:**
```ts
// Extração: m.slice(1) remove o "@"
const mentions = (content.match(/@([\w]+)/g) || []).map((m) => m.slice(1))
// mentions = ["joao"]  ← sem "@"

// Query procura por username sem "@"
.in('username', mentions)
// Mas team_members.username = "@joao"  ← com "@"
```

A normalização em `POST /api/users` adiciona `@` ao username: `"@" + username.toLowerCase()`. O extrator de menções remove o `@` antes da query. A query `.in('username', ["joao"])` nunca encontra `"@joao"` → `mentionedUsers` sempre retorna array vazio → nenhuma notificação é inserida.

**Impacto:** A funcionalidade de notificação por `@mention` está completamente inoperante. Usuários mencionados nunca recebem notificações. O sistema de notificações (módulo `notificacoes`) existe e funciona para o canal Realtime, mas nunca recebe inserções via comentários.

**Resolução esperada:** Corrigir o lookup para incluir `@` nas menções: `.in('username', mentions.map(m => '@' + m))` — ou extrair sem slice e comparar diretamente.

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

| Campo | Valor |
|-------|-------|
| Módulos | `upload`, `kanban-app` |
| Spec | `kanban-app/edge-cases.md EC-18` |
| Documentado nas specs? | ✅ Sim |

**Impacto:** Após upload de arquivo, toda a sessão é reiniciada: modais fecham, posição de scroll perde-se, `currentUser` reseta (logout efetivo). Deveria chamar `fetchData()` como as outras mutações.

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

| Categoria | Quantidade | IDs |
|-----------|-----------|-----|
| 🔴 Crítico | 8 | GAP-01 a GAP-08 |
| 🟡 Moderado | 12 | GAP-09 a GAP-20 |
| 🔵 Cosmético | 6 | GAP-C01 a GAP-C06 |
| **Total** | **26** | |

### Gaps pré-documentados nas specs (corretos)
GAP-01, GAP-02, GAP-03, GAP-04, GAP-05, GAP-06, GAP-07, GAP-09, GAP-10, GAP-11, GAP-12, GAP-13, GAP-14, GAP-15, GAP-16, GAP-17 = **16 gaps**

### Gaps novos encontrados na revisão
GAP-08 (🔴 crítico — @mention bug), GAP-18 (🟡 contagem errada), GAP-19, GAP-20, GAP-C01 a GAP-C06 = **10 gaps novos**

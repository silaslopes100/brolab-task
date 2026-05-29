# Domain — BrolabTask

> Gerado pelo Detective em: 2026-05-29 | doc_level: detalhado

---

## Glossário de Domínio

| Termo | Definição | Confiança |
|-------|-----------|-----------|
| **Task** | Unidade de trabalho rastreável no Kanban. Possui título, descrição, lista de assignees, labels, comentários e arquivos. | 🟢 CONFIRMADO |
| **Column** | Estágio do fluxo de trabalho. Mapeia diretamente para o campo `status` nas tasks no banco. | 🟢 CONFIRMADO |
| **Board** | Conjunto de colunas + tasks. Toda a aplicação é um board único (sem multi-board). | 🟢 CONFIRMADO |
| **Team Member** | Usuário da plataforma. Armazenado em `team_members`. Pode ser regular ou admin. | 🟢 CONFIRMADO |
| **Admin** | Membro com `role = "ADMIN_TOTAL"` ou `role = "ADMIN"`. Tem permissões expandidas. | 🟢 CONFIRMADO |
| **Label** | Marcador colorido de categorização de uma task. Não tem entidade própria — armazenado como `TEXT[]` em `tasks.labels`. Cor calculada deterministicamente a partir do nome. | 🟢 CONFIRMADO |
| **Comment** | Texto livre associado a uma task. Pode conter @menções que geram notificações. | 🟢 CONFIRMADO |
| **Mention** | Referência a um membro via `@username` em um comentário. Dispara uma notificação do tipo `mention` para o usuário mencionado. | 🟢 CONFIRMADO |
| **Notification** | Evento assíncrono entregue a um usuário específico. Tipo atual: `mention`. Estrutura prevê `assignment` e `comment` mas não implementados. | 🟡 INFERIDO |
| **Assignment** | Associação de um membro a uma task via `assignees[]`. Armazena o **nome** do membro (não o ID). | 🟢 CONFIRMADO |
| **Position** | Ordem de uma task dentro de uma coluna. Campo `position INTEGER` em `tasks`. | 🟢 CONFIRMADO |
| **Upload / Attachment** | Arquivo anexado a uma task. Armazenado no bucket `task-files` do Supabase Storage. Registrado em `task_files`. | 🟢 CONFIRMADO |
| **Session** | Estado de autenticação do usuário. Gerenciado exclusivamente em React state (`useState`). Não persiste entre reloads. | 🟢 CONFIRMADO |
| **Realtime** | Canal Supabase para `postgres_changes` em `notifications`. Subscrito por user_id. | 🟢 CONFIRMADO |
| **CLI Theme** | Estética visual terminal hacker: fundo preto `#000000`, texto verde `#00FF66`, fonte JetBrains Mono. | 🟢 CONFIRMADO |

---

## Regras de Negócio

### RN-001 — Login dual: email ou username
🟢 CONFIRMADO — Origem: `app/api/auth/login/route.ts`

O sistema aceita login por email ou por `@username`. O identificador é normalizado:
- Se contém `@` em posição interna (email): busca por `team_members.email`
- Caso contrário: trata como username, normaliza para `@username` e busca por `team_members.username`

```
identificador = "joao@empresa.com" → busca por email
identificador = "joao.silva" → normaliza para "@joao.silva" → busca por username
identificador = "@joao.silva" → mantém "@joao.silva" → busca por username
```

---

### RN-002 — Determinação de papel Admin
🟢 CONFIRMADO — Origem: `app/api/auth/login/route.ts`

```typescript
isAdmin = role === "ADMIN_TOTAL" || role === "ADMIN"
```

Dois valores de role elevam ao status admin. Roles customizadas (ex: `DEVELOPER`, `DESIGNER`) não são admin.

---

### RN-003 — Colunas representam estágios do workflow
🟢 CONFIRMADO — Origem: `app/api/tasks/route.ts`, `app/page.tsx`

O campo `status` no banco armazena o nome da coluna (ex: `"BACKLOG"`, `"FAZENDO"`). O frontend mantém uma lista hardcoded de 5 colunas padrão:

```
["BACKLOG", "FAZENDO", "ALTERAÇÕES", "APROVADO", "FEITO"]
```

Não há tabela de colunas — `GET /api/columns` retorna esta lista fixa.

---

### RN-004 — Ordenação de tasks por posição dentro da coluna
🟢 CONFIRMADO — Origem: `app/api/tasks/route.ts`

Tasks dentro de uma coluna são ordenadas pelo campo `position`. O movimento de tasks (← →) atualiza `columnId` + `position` via `PATCH /api/tasks`.

---

### RN-005 — Labels calculam cor deterministicamente
🟢 CONFIRMADO — Origem: `app/api/tasks/route.ts`, `app/api/labels/route.ts`

A cor de uma label é derivada do hash do seu nome:
```typescript
hash = charCode + ((hash << 5) - hash)  // para cada char
color = LABEL_COLORS[Math.abs(hash) % 7]
```
Paleta de 7 cores: Branca, Cinza, Verde Limão, Verde Pistache, Laranja Forte, Vermelho, Verde Folha.

> **Consequência:** Renomear uma label muda sua cor. Não há forma de escolher a cor manualmente.

---

### RN-006 — @menções em comentários disparam notificações
🟢 CONFIRMADO — Origem: `app/api/comments/route.ts`

Ao salvar um comentário, o sistema extrai tokens `@username` via regex `/@([\w]+)/g`, busca os IDs dos usuários correspondentes e insere uma notificação do tipo `mention` para cada um.

> **Regra de unicidade:** Não há deduplicação — mencionar o mesmo usuário duas vezes no mesmo comentário gera duas notificações.

---

### RN-007 — Assignees armazenam nomes, não IDs
🟡 INFERIDO — Origem: `app/api/tasks/route.ts`, `app/page.tsx`

O campo `tasks.assignees` é `TEXT[]` com os **nomes** dos membros (campo `name` de `team_members`). Não há referência por ID.

> **Consequência:** Renomear um membro na tabela `team_members` não atualiza automaticamente as tasks às quais ele está atribuído.

---

### RN-008 — Somente admins podem gerenciar membros do time
🟢 CONFIRMADO — Origem: `app/page.tsx` (TeamAdminModal)

```typescript
{currentUser.isAdmin && <button onClick={() => onDeleteMember(member.id)}>DEL</button>}
{currentUser.isAdmin && <AddUserForm />}
```

Apenas usuários com `isAdmin === true` visualizam e interagem com os controles de gestão do time.

---

### RN-009 — Notificações entregues em tempo real via Supabase Realtime
🟢 CONFIRMADO — Origem: `app/page.tsx` (useEffect Realtime)

```typescript
supabase.channel(`notifications_user_${id}`)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${id}` })
  .subscribe()
```

Notificações são recebidas em tempo real sem polling.

---

### RN-010 — Logout não invalida sessão server-side
🟡 INFERIDO — Origem: `app/page.tsx`

```typescript
const handleLogout = () => setCurrentUser(null)
```

O logout é puramente client-side. Não há token ou cookie a invalidar. Refresh de página requer novo login.

---

### RN-011 — Upload cria bucket automaticamente na primeira execução
🟡 INFERIDO — Origem: `app/api/upload/route.ts`

Se o bucket `task-files` não existir, o endpoint de upload o cria com visibilidade pública antes de fazer o upload. Idempotente após a primeira criação.

---

### RN-012 — Deletar task cascateia para arquivos
🟢 CONFIRMADO — Origem: `supabase/migrations/001_create_task_files.sql`

```sql
task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
```

A deleção de uma task remove automaticamente os registros de `task_files` associados via FK CASCADE.

---

### RN-013 — Tipos de notificação previstos mas não todos implementados
🟡 INFERIDO — Origem: `app/page.tsx` (interface Notification)

```typescript
type: "mention" | "assignment" | "comment"
```

A interface TypeScript prevê 3 tipos de notificação. Apenas `mention` é gerado pelo código atual. `assignment` e `comment` estão reservados mas nunca emitidos.

---

## Invariantes de Domínio

| ID | Invariante | Confiança |
|----|-----------|-----------|
| INV-001 | Toda task pertence a exatamente uma coluna (campo `status` NOT NULL) | 🟢 CONFIRMADO |
| INV-002 | Toda task tem um `position` dentro da coluna | 🟡 INFERIDO (sem UNIQUE constraint no banco) |
| INV-003 | Notifications sempre têm `user_id` (destinatário) | 🟢 CONFIRMADO |
| INV-004 | Arquivos de task são públicos (bucket public:true) | 🟢 CONFIRMADO |
| INV-005 | Username começa com `@` no banco de dados | 🟢 CONFIRMADO |

---

## Lacunas de Domínio

| ID | Lacuna | Impacto | Confiança |
|----|--------|---------|-----------|
| 🔴 LACUNA-001 | Senhas em plaintext em `team_members.password` | CRÍTICO — comprometimento de banco expõe todas as senhas | 🟢 CONFIRMADO |
| 🔴 LACUNA-002 | `PATCH /api/users` não implementado — perfil não pode ser editado no servidor | ALTO — funcionalidade quebrada silenciosamente | 🟢 CONFIRMADO |
| 🔴 LACUNA-003 | `DELETE /api/users` não implementado — admin não consegue remover membros | ALTO — funcionalidade quebrada silenciosamente | 🟢 CONFIRMADO |
| 🟡 LACUNA-004 | Colunas hardcoded — não persistem no banco | MÉDIO — customização de workflow perdida ao reimplantar | 🟢 CONFIRMADO |
| 🟡 LACUNA-005 | Labels sem tabela própria — renomear muda cor, não há histórico | MÉDIO — sem rastreabilidade de labels | 🟢 CONFIRMADO |
| 🟡 LACUNA-006 | Assignees por nome (não ID) — sem integridade referencial | MÉDIO — membros renomeados ficam "órfãos" em tasks | 🟢 CONFIRMADO |
| 🟡 LACUNA-007 | `updated_at` ausente em todas as tabelas | BAIXO — sem auditoria temporal de mudanças | 🟢 CONFIRMADO |
| 🟡 LACUNA-008 | Sem rate limiting no endpoint de autenticação | ALTO — vulnerável a força bruta | 🟢 CONFIRMADO |
| 🟡 LACUNA-009 | Notificações `assignment` e `comment` previstas mas não emitidas | BAIXO — feature incompleta | 🟡 INFERIDO |
| 🟡 LACUNA-010 | Sem paginação em nenhum endpoint | BAIXO — pode degradar com volume | 🟡 INFERIDO |

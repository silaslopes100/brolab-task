# Permissões e Papéis — BrolabTask

> Gerado pelo Detective em: 2026-05-29 | doc_level: detalhado

---

## Papéis (Roles)

| Papel | Origem | Descrição | Confiança |
|-------|--------|-----------|-----------|
| **Membro Regular** | `role` ≠ `"ADMIN_TOTAL"` e ≠ `"ADMIN"` | Usuário padrão do sistema. Pode interagir com o board e tasks. | 🟢 CONFIRMADO |
| **Admin** | `role === "ADMIN_TOTAL"` ou `role === "ADMIN"` | Usuário com permissões de gestão do time. Calculado em login como `isAdmin`. | 🟢 CONFIRMADO |

> **Nota:** O campo `role` em `team_members` é uma string livre. Apenas os dois valores acima elevam ao status admin. Outros valores (ex: `DEVELOPER`, `DESIGNER`, `FRONT_END`) são válidos mas sem efeito em permissões.

---

## Matriz de Permissões

### Autenticação e Sessão

| Ação | Membro Regular | Admin | Confiança |
|------|---------------|-------|-----------|
| Login por email | ✅ | ✅ | 🟢 |
| Login por @username | ✅ | ✅ | 🟢 |
| Logout (client-side) | ✅ | ✅ | 🟢 |

---

### Board e Colunas

| Ação | Membro Regular | Admin | Confiança |
|------|---------------|-------|-----------|
| Visualizar board | ✅ | ✅ | 🟢 |
| Adicionar coluna customizada | ✅ | ✅ | 🟡 (sem restrição por role no código) |
| Deletar coluna | ✅ | ✅ | 🟡 (sem restrição, mas DELETE é no-op) |

> ⚠️ Colunas são hardcoded. POST/DELETE de colunas são no-ops ou temporários.

---

### Tasks

| Ação | Membro Regular | Admin | Confiança |
|------|---------------|-------|-----------|
| Visualizar tasks | ✅ | ✅ | 🟢 |
| Criar task | ✅ | ✅ | 🟢 |
| Editar task (título, descrição, labels, assignees) | ✅ | ✅ | 🟢 |
| Mover task entre colunas | ✅ | ✅ | 🟢 |
| Reordenar task (↑↓) | ✅ | ✅ | 🟢 |
| Deletar task | ✅ | ✅ | 🟢 |
| Fazer upload de arquivo para task | ✅ | ✅ | 🟢 |
| Deletar arquivo de task | ✅ | ✅ | 🟢 |
| Adicionar comentário | ✅ | ✅ | 🟢 |
| @mencionar membro em comentário | ✅ | ✅ | 🟢 |

> **Observação:** Não há controle de propriedade. Qualquer membro pode editar ou deletar qualquer task, independente de quem a criou ou está atribuído.

---

### Notificações

| Ação | Membro Regular | Admin | Confiança |
|------|---------------|-------|-----------|
| Receber notificações de @menção | ✅ | ✅ | 🟢 |
| Visualizar próprias notificações | ✅ | ✅ | 🟢 |
| Marcar notificação como lida | ✅ | ✅ | 🟢 |
| Limpar todas as notificações | ✅ | ✅ | 🟢 |
| Ver notificações de outro usuário | ❌ | ❌ | 🟢 (filtro por userId) |

---

### Gestão do Time

| Ação | Membro Regular | Admin | Confiança |
|------|---------------|-------|-----------|
| Visualizar lista do time | ✅ | ✅ | 🟢 |
| Visualizar botão `[ ADMIN_MODE ]` | ❌ | ✅ | 🟢 |
| Criar novo membro | ❌ | ✅ | 🟢 |
| Deletar membro (UI) | ❌ | ✅ (exceto a si mesmo) | 🟢 |
| Definir ADMIN_PRIVILEGES para novo membro | ❌ | ✅ | 🟢 |
| Editar perfil próprio | ✅ | ✅ | 🔴 QUEBRADO (PATCH /api/users → 405) |
| Deletar membro (servidor) | ❌ | 🔴 QUEBRADO | 🔴 (DELETE /api/users → 405) |

---

### Perfil

| Ação | Membro Regular | Admin | Confiança |
|------|---------------|-------|-----------|
| Visualizar botão `[ EDIT_PROFILE ]` | ✅ | ✅ | 🟢 |
| Salvar alterações de perfil | ❌ 🔴 QUEBRADO | ❌ 🔴 QUEBRADO | 🔴 (sem handler PATCH no servidor) |

---

## Implementação das Verificações

Todas as verificações de permissão são feitas **exclusivamente no frontend**:

```typescript
// Controle de UI — não há enforcement no backend
{currentUser.isAdmin && <button onClick={() => onDeleteMember(member.id)}>DEL</button>}
{currentUser.isAdmin && <AddUserForm />}
{currentUser.isAdmin && "[ ADMIN_MODE ]"}
```

> 🔴 **LACUNA CRÍTICA DE SEGURANÇA:** Não há verificação de `isAdmin` ou qualquer autenticação nos endpoints da API. Qualquer request direta a `POST /api/users`, `DELETE /api/users?id=...` etc. é aceita sem validação de quem está fazendo a chamada.

---

## Resumo do Modelo RBAC

```
┌─────────────────────────────────────────────────────┐
│                   BROLABTASK RBAC                    │
├──────────────────┬──────────────────────────────────┤
│  MEMBRO REGULAR  │              ADMIN                │
│  (role = *)      │  (role = ADMIN_TOTAL | ADMIN)    │
├──────────────────┴──────────────────────────────────┤
│  Board, Tasks, Comentários, Files, Notificações     │
│                  (acesso total a todos)              │
├──────────────────┬──────────────────────────────────┤
│        ✗         │  Criar Usuários                  │
│        ✗         │  Deletar Membros (UI apenas)     │
│        ✗         │  Ver badge [ADMIN_MODE]           │
└──────────────────┴──────────────────────────────────┘

⚠️  Enforcement: APENAS no frontend (React state)
⚠️  Backend: SEM autenticação ou autorização nos endpoints
```

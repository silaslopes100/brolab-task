# ADR-004 — Login: Duas Queries Separadas em vez de `.or()` com `@`

> Status: ACEITO | Data: 2026-05-27 | Confiança: 🟢 CONFIRMADO

---

## Contexto

A funcionalidade de login por email OU @username exige buscar o usuário em dois campos. A abordagem mais direta seria usar o filtro `.or()` do Supabase para buscar `email.eq.X,username.eq.X` em uma única query.

Porém, o caractere `@` no username causa comportamento inesperado no parser de filtros do Supabase quando usado dentro de `.or()`.

Evidências:
- Commit `8d34635 fix: split login query to avoid @ in .or() filter` (2026-05-27)
- Mensagem explícita do commit documenta o motivo exato

Implementação resultante:
```typescript
// Query 1: Tenta por email
const { data: userByEmail } = await supabase
  .from("team_members")
  .select("*")
  .eq("email", loginIdentifier)
  .single()

// Query 2: Se não encontrou, tenta por username
if (!userByEmail) {
  const normalizedUsername = `@${loginIdentifier.replace(/^@/, "")}`
  const { data: userByUsername } = await supabase
    .from("team_members")
    .select("*")
    .eq("username", normalizedUsername)
    .single()
}
```

## Decisão

Implementar duas queries sequenciais independentes ao invés de uma query combinada com `.or()`.

## Alternativas consideradas

| Alternativa | Razão de descarte |
|-------------|------------------|
| `.or("email.eq.X,username.eq.X")` | Bug confirmado: `@` no valor causa falha no parser do Supabase `.or()` |
| Normalizar username para não usar `@` | Quebraria o contrato existente de dados + UX do campo |
| Raw SQL via `rpc()` | Mais complexo e menos idiomático para uma query simples |

## Consequências

**Positivas:**
- Contorna o bug do parser do Supabase sem alterar o esquema de dados
- Código explícito e legível — cada caminho de busca é independente

**Negativas:**
- 🟡 Dois round-trips ao banco no pior caso (quando o identificador é username) — impacto de latência mínimo para este contexto
- 🟡 Comportamento assimétrico: email falha → tenta username; não há tentativa de email se username for passado com `@`

# ADR-002 — Autenticação Customizada em vez de Supabase Auth

> Status: ACEITO | Data: 2026-05-27 | Confiança: 🟢 CONFIRMADO

---

## Contexto

O Supabase oferece um sistema de autenticação nativo (`supabase.auth`) com email/senha, OAuth, magic links, JWTs, refresh tokens e gestão de sessões. Apesar disso, o BrolabTask implementou autenticação própria usando a tabela `team_members`.

Evidências:
- Tabela `team_members` com campo `password TEXT` (plaintext)
- `app/api/auth/login/route.ts`: busca manual na tabela, comparação direta de senha
- Ausência de qualquer uso de `supabase.auth.*` no codebase
- Logout implementado como `setCurrentUser(null)` (sem invalidação de token)

## Decisão

Implementar autenticação customizada com tabela própria de usuários, comparação direta de senha e estado de sessão gerenciado apenas em React state.

## Alternativas consideradas

| Alternativa | Razão de descarte |
|-------------|------------------|
| Supabase Auth (email+senha nativo) | 🟡 INFERIDO: provavelmente descartado pelo v0.dev na geração; integração com Auth exige configuração adicional |
| JWT próprio com cookies httpOnly | 🟡 INFERIDO: complexidade adicional evitada no scaffolding inicial |
| Session com NextAuth.js | 🟡 INFERIDO: dependência extra evitada |

## Consequências

**Positivas:**
- Controle total sobre o esquema de usuários (`team_members`)
- Login por @username nativo (sem adaptação ao formato email obrigatório do Supabase Auth)
- Campos customizados por membro sem limitações do schema Supabase Auth

**Negativas:**
- 🔴 **CRÍTICO:** Senhas armazenadas em plaintext — comprometimento do banco expõe todas as credenciais (OWASP A02)
- 🔴 **CRÍTICO:** Sem tokens ou sessões server-side — logout não invalida acesso; replay attack possível
- 🔴 **ALTO:** Sem rate limiting na rota de login — vulnerável a força bruta (OWASP A07)
- 🟡 Sem expiração automática de sessão
- 🟡 Reload de página exige novo login (estado não persistido)
- 🟡 Sem recuperação de senha, cadastro self-service ou 2FA

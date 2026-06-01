# Autenticação — Perguntas Abertas

> `questions.md` | Módulo: `autenticacao` | doc_level: detalhado
> Estas questões requerem decisão humana antes da implementação segura.

---

## Q-01 🔴 — Algoritmo de hashing de senha

**Pergunta:** Qual algoritmo de hashing deve ser usado para substituir o plaintext?
- Opção A: `bcrypt` (cost factor 12) — padrão da indústria, suporte amplo em Node.js
- Opção B: `argon2id` — mais moderno, recomendado pelo OWASP

**Impacto:** Migration de dados necessária — todas as senhas existentes em `team_members.password` precisam ser re-hasheadas (requer re-cadastro ou reset forçado).

**Fonte do problema:** `app/api/auth/login/route.ts:48` — `user.password !== password`

---

## Q-02 🔴 — Estratégia de sessão após login

**Pergunta:** Como a sessão deve ser mantida após login bem-sucedido?
- Opção A: Cookie HttpOnly/Secure com JWT assinado (server-managed)
- Opção B: Adotar Supabase Auth nativo (email+password)
- Opção C: Manter estado no cliente (atual — apenas `useState`)

**Impacto:** Opção C (atual) impede logout real, não protege API routes, e não sobrevive a reload de página sem re-login. Opções A e B exigem refatoração significativa.

---

## Q-03 🔴 — Rate limiting

**Pergunta:** Qual a política de rate limiting para o endpoint de login?
- Quantas tentativas por IP? Por usuário?
- Qual janela de tempo?
- Bloqueio temporário ou permanente?

**Impacto:** Sem rate limiting, ataques de brute force são triviais, especialmente com senhas em plaintext.

---

## Q-04 🟡 — Campo `role_id`

**Pergunta:** O campo `role_id` retornado no objeto do usuário tem algum uso planejado?

**Evidência:** `app/api/auth/login/route.ts:62` — `role_id: user.role_id` incluído na resposta mas não utilizado em nenhum lugar do SPA.

**Impacto baixo:** Pode ser omitido da resposta se não houver uso previsto.

---

## Q-05 🟡 — Validade da sessão / expiração

**Pergunta:** Por quanto tempo um usuário deve permanecer "logado"?

**Situação atual:** A sessão nunca expira — `currentUser` persiste enquanto a aba do browser estiver aberta. Refresh da página faz logout implícito (estado perdido).

---

## Q-06 🟡 — Login simultâneo em múltiplos dispositivos

**Pergunta:** É permitido que o mesmo usuário esteja logado em múltiplos dispositivos/abas simultaneamente?

**Impacto:** Relevante para a escolha da estratégia de sessão (Q-02).

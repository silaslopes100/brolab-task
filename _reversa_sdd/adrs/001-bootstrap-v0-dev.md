# ADR-001 — Bootstrap com v0.dev (AI Code Generation)

> Status: ACEITO | Data: 2026-05-27 | Confiança: 🟢 CONFIRMADO

---

## Contexto

O projeto BrolabTask foi iniciado a partir da plataforma [v0.dev](https://v0.dev) da Vercel, que gera código React/Next.js a partir de prompts em linguagem natural. Evidências:

- Commit `40bcc16 Initial commit from v0` (2026-05-27)
- Commit `13f0553` com autor `v0[bot]@users.noreply.github.com` e mensagem: *"feat: implement full BROLABTASK V2 with requested features — Add robust authentication, advanced task control, label system, comments, mentions, and profile management."*
- Commit `f8d18a8 fix: clean invalid XML from layout.tsx — Remove corrupt XML remnants and restore valid TypeScript code` — necessidade de limpeza imediata após geração

## Decisão

Usar v0.dev para bootstrapping inicial do projeto, gerando em um único prompt a SPA Kanban completa com todas as features desejadas, depois adaptando manualmente para integração com Supabase.

## Alternativas consideradas

| Alternativa | Razão de descarte |
|-------------|------------------|
| Scaffolding manual (create-next-app) | Maior tempo de setup para features básicas |
| Template de projeto existente | Não tinha o design visual CLI/hacker desejado |
| Geração incremental feature por feature | v0.dev é mais eficiente gerando tudo de uma vez |

## Consequências

**Positivas:**
- Entrega extremamente rápida do layout e estrutura inicial
- Código tipado em TypeScript com componentes bem separados

**Negativas:**
- Código gerado continha XML inválido em `layout.tsx` (necessitou fix imediato)
- SPA monolítica com 1960 LOC em um único arquivo (`app/page.tsx`) — difícil de manter
- Lógica de negócio e UI mescladas sem separação de camadas
- Features críticas de segurança ausentes (hash de senha, tokens de sessão) — comum em código gerado por IA
- Integrações de backend (Supabase) geradas com erros que precisaram de múltiplos commits de fix

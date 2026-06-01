# ADR-005 — Fallback SUPABASE_PUBLISHABLE_KEY como Alias de ANON_KEY

> Status: ACEITO | Data: 2026-05-27 | Confiança: 🟢 CONFIRMADO

---

## Contexto

O Supabase historicamente usava a variável de ambiente `SUPABASE_ANON_KEY` para a chave pública anônima. Em versões mais recentes (e na plataforma Vercel), o nome padrão mudou para `SUPABASE_PUBLISHABLE_KEY`.

O projeto tinha ambientes com nomes diferentes configurados, causando falhas de inicialização do cliente Supabase no browser.

Evidências:
- Commit `9731db5 feat(supabase): accept publishable key as fallback for anon key` (2026-05-27)
- Implementação em `lib/supabase/client.ts` e `lib/supabase/server.ts`:

```typescript
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
```

## Decisão

Aceitar ambos os nomes de variável de ambiente com fallback, priorizando `ANON_KEY` e usando `PUBLISHABLE_KEY` como alias.

## Alternativas consideradas

| Alternativa | Razão de descarte |
|-------------|------------------|
| Standardizar para apenas um nome | Quebraria ambientes já configurados com o outro nome |
| Usar apenas `PUBLISHABLE_KEY` | Quebraria setups locais com `ANON_KEY` |
| Documentar e exigir migração | Overhead desnecessário para time pequeno |

## Consequências

**Positivas:**
- Compatibilidade com ambientes Vercel (usa `PUBLISHABLE_KEY`) e locais (podem usar `ANON_KEY`)
- Sem necessidade de reconfigurar nenhum ambiente existente

**Negativas:**
- 🟡 Dupla fonte de configuração pode confundir novos colaboradores
- 🟡 Se ambas estiverem definidas com valores diferentes, `ANON_KEY` silenciosamente prevalece

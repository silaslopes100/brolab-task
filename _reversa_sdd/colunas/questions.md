# Colunas — Perguntas Abertas

> `questions.md` | Módulo: `colunas`

---

## Q-01: Por que POST e DELETE não persistem no banco?

- **Contexto:** O POST retorna a coluna criada mas não a insere em nenhuma tabela; o DELETE é no-op
- **Hipótese 1:** Funcionalidade planejada mas não implementada
- **Hipótese 2:** Colunas foram sempre hardcoded e POST/DELETE são stubs para satisfazer o contrato de API do front-end
- **Impacto:** 🔴 Kanban não é configurável em produção
- **Ação:** Confirmar com o autor se a intenção era implementar persistência ou manter fixo

---

## Q-02: O front-end usa POST/DELETE de colunas?

- **Contexto:** O SPA em `app/page.tsx` pode ou não ter botões de adicionar/remover colunas
- **Hipótese:** Se não há UI para isso, POST/DELETE nunca são chamados
- **Ação:** Verificar `app/page.tsx` por chamadas a `/api/columns` além do GET

---

## Q-03: A ordem das colunas é relevante para o negócio?

- **Contexto:** `["BACKLOG", "FAZENDO", "ALTERAÇÕES", "APROVADO", "FEITO"]` parece um fluxo de trabalho específico
- **Hipótese:** Representa as etapas de aprovação de conteúdo/design
- **Ação:** Confirmar semântica de negócio das 5 colunas

---

## Q-04: O que acontece com tasks em coluna deletada?

- **Contexto:** Se DELETE funcionasse, tasks com `status = "DELETADA"` ficariam órfãs
- **Hipótese:** A ausência de CASCADE e a natureza no-op do DELETE foram "solucionadas" não implementando a deleção
- **Ação:** Planejar estratégia de migração de tasks ao implementar DELETE real

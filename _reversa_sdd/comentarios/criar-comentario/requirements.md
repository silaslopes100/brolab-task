# Criar Comentário — Requisitos

> `requirements.md` | Caso de uso: `comentarios/criar-comentario`
> Fonte: `app/api/comments/route.ts`

---

## Visão Geral

Único caso de uso do módulo. Persiste um comentário e, se houver menções `@username`, dispara notificações. 🟢

---

## Responsabilidades

- Inserir comentário em `task_comments` 🟢
- Detectar `@mentions` e notificar membros existentes 🟢
- Retornar comentário formatado 🟢

---

## Regras de Negócio

- Ver `comentarios/requirements.md` (RN-01 a RN-07)

---

## Critérios de Aceite

```gherkin
Quando POST /api/comments { taskId, authorUsername, content: "olá @alice" }
E "alice" existe em team_members
Então HTTP 200 com comment retornado
E notificação inserida em notifications para alice
```

---

## Rastreabilidade

| Bloco | Arquivo | Linhas |
|-------|---------|--------|
| POST handler completo | `app/api/comments/route.ts` | 1-75 |

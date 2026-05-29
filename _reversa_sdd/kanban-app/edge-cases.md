# Kanban App — Edge Cases

> `edge-cases.md` | Módulo: `kanban-app`

---

## LoginScreen

| ID | Cenário | Comportamento Atual |
|----|---------|-------------------|
| EC-01 | Email vazio | Botão desabilitado (disabled) |
| EC-02 | Senha vazia | Botão desabilitado (disabled) |
| EC-03 | Enter na senha | Dispara `handleLogin()` |
| EC-04 | Credenciais inválidas | Exibe erro retornado pela API |
| EC-05 | Loading duplo | `externalLoading` prop desabilita botão durante chamada pai |

---

## Notificações

| ID | Cenário | Comportamento Atual |
|----|---------|-------------------|
| EC-06 | Realtime: nova notificação | Prepend ao array local — sem dedup |
| EC-07 | Logout com canal ativo | `removeChannel()` no cleanup do useEffect |
| EC-08 | `fetchNotifications()` com currentUser null | Guard `if (!currentUser) return` |

---

## MentionInput

| ID | Cenário | Comportamento Atual |
|----|---------|-------------------|
| EC-09 | `@` sem letras seguintes | Exibe lista completa do time |
| EC-10 | `@texto` com espaço | Fecha dropdown |
| EC-11 | Time vazio | Dropdown não aparece (filteredTeam.length === 0) |
| EC-12 | Click fora do dropdown | Dropdown NÃO fecha — não há handler de click-outside |

---

## TaskCard — Navegação

| ID | Cenário | Comportamento Atual |
|----|---------|-------------------|
| EC-13 | Primeira tarefa da coluna | Botão ▲ desabilitado |
| EC-14 | Última tarefa da coluna | Botão ▼ desabilitado |
| EC-15 | Coluna mais à esquerda | Botão ← não renderizado |
| EC-16 | Coluna mais à direita | Botão → não renderizado |
| EC-17 | Click no card (não em botão) | Abre TaskEditModal |

---

## Upload de Arquivo

| ID | Cenário | Comportamento Atual |
|----|---------|-------------------|
| EC-18 | Upload com sucesso | `window.location.reload()` — perde estado |
| EC-19 | Upload falha | `console.error` — sem feedback visual |

---

## Colunas

| ID | Cenário | Comportamento Atual |
|----|---------|-------------------|
| EC-20 | Coluna default (nome em DEFAULT_COLUMN_NAMES) | Botão × não renderizado |
| EC-21 | Criar coluna com nome vazio | Botão [CREATE] desabilitado |

---

## Fetch de Dados

| ID | Cenário | Comportamento Atual |
|----|---------|-------------------|
| EC-22 | API retorna erro | `console.error` + `catch(() => ({}))` — app funciona sem dados |
| EC-23 | fetchData() em cada mutação | Sem debounce — potencial sobrecarga em operações rápidas |

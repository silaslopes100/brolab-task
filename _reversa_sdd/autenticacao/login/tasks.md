# Login — Tarefas de Implementação

> `tasks.md` | Caso de uso: `autenticacao/login` | doc_level: detalhado

---

## Pré-requisitos

- [ ] Endpoint `POST /api/auth/login` implementado (ver `autenticacao/tasks.md`)
- [ ] `currentUser` state disponível no componente raiz

---

## Tarefas

- [ ] T-01 — Implementar componente `LoginScreen` com campos de identificador e senha
  - Origem no legado: `app/page.tsx` (componente `LoginScreen`)
  - Critério de pronto: formulário renderiza com dois inputs e botão de submit
  - Confiança: 🟢

- [ ] T-02 — Implementar `handleLogin` no componente raiz `BroLabTask`
  - Origem no legado: `app/page.tsx` (`handleLogin`)
  - Critério de pronto: função recebe `(identifier, password)`, faz POST e chama `setCurrentUser`
  - Confiança: 🟢

- [ ] T-03 — Conectar loading state ao `handleLogin` (isLoading + loadingMessage)
  - Origem no legado: `app/page.tsx` (`isLoading`, `loadingMessage` states)
  - Critério de pronto: durante o fetch, `isLoading === true` e `loadingMessage` tem valor adequado
  - Confiança: 🟡

- [ ] T-04 — Exibir mensagem de erro no formulário em caso de HTTP 4xx/5xx
  - Origem no legado: `app/page.tsx` (`LoginScreen`)
  - Critério de pronto: credenciais inválidas → mensagem de erro visível no formulário
  - Confiança: 🟡

- [ ] T-05 — Renderização condicional: `LoginScreen` quando `currentUser === null`, `KanbanBoard` quando autenticado
  - Origem no legado: `app/page.tsx` (render logic de `BroLabTask`)
  - Critério de pronto: transição automática após `setCurrentUser(data.user)`
  - Confiança: 🟢

- [ ] T-06 — Chamar `fetchData()` após login bem-sucedido
  - Origem no legado: `app/page.tsx` (`handleLogin` → `fetchData()`)
  - Critério de pronto: board carregado com dados reais logo após login
  - Confiança: 🟢

---

## Tarefas de Teste

- [ ] TT-01 — LoginScreen renderiza corretamente
- [ ] TT-02 — Submit com credenciais válidas → currentUser populado + board visível
- [ ] TT-03 — Submit com credenciais inválidas → mensagem de erro exibida
- [ ] TT-04 — Estado de loading visível durante requisição

---

## Ordem Sugerida

1. T-01 (componente de UI)
2. T-02 (lógica de auth)
3. T-05 (renderização condicional)
4. T-03 + T-04 (UX de feedback)
5. T-06 (carregamento de dados pós-login)

---

## Lacunas Pendentes (🔴)

- Persistência de sessão: após implementar cookie server-side (ver `autenticacao/questions.md` Q-02), o `LoginScreen` deve verificar a sessão existente no mount

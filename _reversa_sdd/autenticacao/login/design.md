# Login — Design Técnico

> `design.md` | Caso de uso: `autenticacao/login` | doc_level: detalhado
> Fonte: `app/page.tsx` (handleLogin, LoginScreen)

---

## Interface

**Componente:** `LoginScreen`
| Prop | Tipo | Descrição |
|------|------|-----------|
| `onLogin` | `(identifier: string, password: string) => Promise<void>` | Handler de submit passado pelo `BroLabTask` root 🟡 |

**Handler:** `handleLogin` em `BroLabTask`
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `identifier` | string | Email ou @username |
| `password` | string | Senha em texto plano |

---

## Fluxo Principal

1. `BroLabTask` renderiza `<LoginScreen onLogin={handleLogin} />` quando `currentUser === null` 🟢
2. Usuário preenche identificador e senha no formulário 🟢
3. Submit chama `handleLogin(identifier, password)` 🟢
4. `handleLogin` faz `setIsLoading(true)` + `setLoadingMessage("Autenticando...")` 🟡
5. `fetch("POST /api/auth/login", { body: { email: identifier, password } })` 🟢
6. Se resposta ok → `setCurrentUser(data.user)` → `fetchData()` (carrega board) 🟢
7. Se resposta de erro → exibe mensagem de erro no formulário 🟡
8. `setIsLoading(false)` ao final 🟡

---

## Fluxos Alternativos

- **Erro de rede (fetch falha):** `catch` no `handleLogin` — comportamento exato não confirmado 🟡
- **Usuário já logado:** `LoginScreen` não é renderizado — `BroLabTask` já exibe o board 🟢

---

## Dependências

- `fetch` nativo do browser → `POST /api/auth/login` 🟢
- `setCurrentUser` (useState setter) → armazena o usuário autenticado 🟢
- `fetchData()` → carrega colunas, tasks e usuários após login 🟢

---

## Estado Interno

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `currentUser` | `TeamMember \| null` | null = não autenticado; populado após login bem-sucedido |
| `isLoading` | boolean | true durante a requisição de login |
| `loadingMessage` | string | Mensagem exibida no `LoadingScreen` |

---

## Riscos e Lacunas

- 🟡 Comportamento exato de error handling no `LoginScreen` (qual estado local guarda o erro) não confirmado — requer leitura linha a linha de `app/page.tsx`
- 🔴 Sem persistência de sessão: refresh da página → `currentUser = null` → volta ao LoginScreen

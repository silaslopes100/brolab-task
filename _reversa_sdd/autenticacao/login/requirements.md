# Login — Requisitos

> `requirements.md` | Caso de uso: `autenticacao/login` | doc_level: detalhado
> Fonte: `app/api/auth/login/route.ts` + `app/page.tsx` (handleLogin, LoginScreen)

---

## Visão Geral

Caso de uso que representa a ação completa de autenticação de um membro: desde a digitação das credenciais na tela até o estado autenticado no SPA. Envolve o componente `LoginScreen` no cliente e o endpoint `POST /api/auth/login` no servidor.

---

## Responsabilidades

- Exibir formulário de login com campos de identificador e senha 🟢
- Submeter credenciais ao servidor via `POST /api/auth/login` 🟢
- Armazenar o objeto `user` retornado em `currentUser` (state) 🟢
- Exibir mensagem de erro em caso de falha 🟢
- Transicionar para o board Kanban após login bem-sucedido 🟢

---

## Regras de Negócio

- RN-01: O campo de identificador aceita email ou @username 🟢
- RN-02: Enquanto a requisição está em andamento, `isLoading = true` com mensagem `"Autenticando..."` 🟡
- RN-03: Em caso de erro HTTP (4xx/5xx), a mensagem de erro é exibida no formulário 🟡
- RN-04: Após login bem-sucedido, `fetchData()` é chamado para carregar o board 🟢

---

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|------------|-------------------|
| RF-01 | Exibir `LoginScreen` quando `currentUser === null` | Must | SPA carregada sem sessão → formulário visível |
| RF-02 | Submeter credenciais ao endpoint correto via fetch POST | Must | Credenciais válidas → `currentUser` atualizado |
| RF-03 | Mostrar estado de loading durante a requisição | Should | Botão desabilitado ou spinner visível durante fetch |
| RF-04 | Exibir mensagem de erro para credenciais inválidas | Must | HTTP 401 → mensagem de erro no formulário |
| RF-05 | Redirecionar para board após login bem-sucedido | Must | `currentUser !== null` → `KanbanBoard` renderizado |

---

## Critérios de Aceitação

```gherkin
# Cenário 1 — Login bem-sucedido
Dado que o usuário está na tela de login
Quando preencher credenciais válidas e submeter
Então currentUser é populado com os dados do usuário
E o board Kanban é exibido

# Cenário 2 — Credenciais inválidas
Dado que o usuário está na tela de login
Quando preencher credenciais incorretas e submeter
Então uma mensagem de erro é exibida no formulário
E o formulário permanece visível

# Cenário 3 — Loading state
Dado que o usuário submeteu o formulário
Quando a requisição está em andamento
Então a interface indica que está processando
```

---

## Rastreabilidade de Código

| Arquivo | Função / Bloco | Cobertura |
|---------|---------------|-----------|
| `app/page.tsx` | `LoginScreen` componente | 🟢 |
| `app/page.tsx` | `handleLogin()` | 🟢 |
| `app/page.tsx` | `currentUser` state + `setCurrentUser()` | 🟢 |
| `app/api/auth/login/route.ts` | `POST handler` | 🟢 |

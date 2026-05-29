# Login Screen — Requirements

> `kanban-app/login-screen/requirements.md`

## Descrição
Tela de autenticação em estilo terminal. Suporte a email ou `@username`.

## Comportamento
- Campo email aceita `email@domain.com` ou `@username`
- Campo senha com `type="password"`; Enter na senha dispara login
- Botão `[ LOGIN ]` desabilitado enquanto algum campo está vazio ou durante loading
- Mensagem de erro exibida em bloco vermelho quando `error !== null`
- `externalLoading` prop permite que o pai suspenda o botão independentemente

## UI
- Fundo preto, border verde `#00FF66`
- Status bar: `SYSTEM_STATUS: SECURE`, `CONNECTION: SUPABASE_ENCRYPTED`
- Cursor piscante `animate-pulse` durante waiting
- Botão muda texto para `AUTHENTICATING...` durante loading

# User Stories — Fluxo Kanban

> `user-stories/fluxo-kanban.md` | BrolabTask

---

## Épico: Autenticação

**US-01** — Como **membro do time**, quero fazer login com meu email e senha, para que eu possa acessar o board do meu time.

**Critérios de aceite:**
- Posso usar `email@domain.com` ou `@username` no campo de email
- Ao pressionar Enter no campo de senha, o login é disparado
- Enquanto o login está sendo processado, o botão exibe "AUTHENTICATING..."
- Se as credenciais forem inválidas, vejo uma mensagem de erro em vermelho
- Após login bem-sucedido, sou redirecionado ao board principal

---

**US-02** — Como **usuário autenticado**, quero fazer logout, para que minha sessão seja encerrada com segurança.

**Critérios de aceite:**
- Botão `[ EXIT_SESSION ]` visível no header
- Após logout, sou redirecionado à tela de login
- Minhas notificações são limpas do estado local

---

## Épico: Gestão de Tarefas

**US-03** — Como **membro do time**, quero criar uma nova tarefa em uma coluna, para que o trabalho seja registrado no board.

**Critérios de aceite:**
- Clico em `[ + NEW TASK ]` dentro de uma coluna
- Preencho título (obrigatório) e descrição (opcional)
- Seleciono um ou mais assignees do time
- A tarefa aparece ao final da coluna após confirmação

---

**US-04** — Como **membro do time**, quero mover uma tarefa para outra coluna, para refletir o progresso do trabalho.

**Critérios de aceite:**
- Botões ← e → aparecem no card (exceto nas bordas do board)
- A task aparece na coluna destino imediatamente após a operação

---

**US-05** — Como **membro do time**, quero reordenar tarefas dentro de uma coluna, para priorizar o trabalho.

**Critérios de aceite:**
- Botões ▲ e ▼ aparecem no card
- ▲ desabilitado na primeira tarefa, ▼ desabilitado na última

---

**US-06** — Como **membro do time**, quero editar os detalhes de uma tarefa, para manter as informações atualizadas.

**Critérios de aceite:**
- Clico no card e o modal de edição abre
- Posso alterar: título, descrição, assignees, labels
- As alterações são salvas ao clicar em `[ SAVE ]`

---

**US-07** — Como **membro do time**, quero deletar uma tarefa, para remover trabalho cancelado ou duplicado.

**Critérios de aceite:**
- Botão DEL visível no card
- A task e seus arquivos no Storage são removidos

---

## Épico: Colunas

**US-08** — Como **membro do time**, quero criar novas colunas, para personalizar o fluxo do meu time.

**Critérios de aceite:**
- Botão `[ + NEW COLUMN ]` ao final do board
- Coluna criada aparece imediatamente no board

---

**US-09** — Como **membro do time**, quero remover colunas customizadas, para limpar o board.

**Critérios de aceite:**
- Botão × aparece apenas em colunas não-default
- Colunas default (`BACKLOG`, `FAZENDO`, `ALTERAÇÕES`, `APROVADO`, `FEITO`) não podem ser removidas

---

## Épico: Labels e Comentários

**US-10** — Como **membro do time**, quero adicionar etiquetas coloridas a uma tarefa, para categorizar visualmente o trabalho.

**Critérios de aceite:**
- No modal de edição, acesso o gerenciador de labels
- Escolho um nome e uma das 7 cores disponíveis
- O badge da label aparece no card e no modal

---

**US-11** — Como **membro do time**, quero comentar em uma tarefa, para comunicar contexto e atualizações.

**Critérios de aceite:**
- No modal de edição, vejo o histórico de comentários
- Posso adicionar novo comentário e postar com `[ POST_COMMENT ]`
- Posso mencionar membros com `@username` — recebem notificação

---

## Épico: Arquivos

**US-12** — Como **membro do time**, quero anexar arquivos a uma tarefa, para centralizar documentação e recursos.

**Critérios de aceite:**
- No modal de edição, clico em `[ UPLOAD_FILE ]`
- O arquivo é enviado ao Supabase Storage
- O link aparece na lista de arquivos da task

# Flowchart — Função `comments POST @mention` (detalhado)

> Função: `POST /api/comments` — `app/api/comments/route.ts`
>
> Fluxo detalhado: extração de @menções + dispatch de notificações + insert.

```mermaid
flowchart TD
    START([POST /api/comments]) --> P[Parse body: taskId, authorUsername, content]
    P --> C1{adminClient OK?}
    C1 -- Não --> E1([500 erro])

    C1 -- Sim --> M1[mentions = content.match /@[\w]+/g]
    M1 --> M2{mentions.length > 0?}

    M2 -- Sim --> DB1[SELECT id FROM team_members WHERE username IN mentions]
    DB1 --> DB2{Encontrou users?}
    DB2 -- Não --> SKIP[Pula notificações]
    DB2 -- Sim --> DB3[SELECT title FROM tasks WHERE id = taskId]
    DB3 --> DB4[taskTitle = resultado ou 'Tarefa']

    DB4 --> LOOP[Para cada user em mentionedUsers]
    LOOP --> N1[INSERT INTO notifications]
    N1 --> N2["type: 'mention'"]
    N2 --> N3["message: '{authorUsername} mencionou você na tarefa {taskTitle}'"]
    N3 --> N4[user_id: user.id - task_id - task_title - from_user: authorUsername - read: false]
    N4 --> N5{Mais users?}
    N5 -- Sim --> LOOP
    N5 -- Não --> INSERT_COMMENT

    M2 -- Não --> SKIP --> INSERT_COMMENT

    INSERT_COMMENT[INSERT INTO task_comments - task_id, author_username, content]
    INSERT_COMMENT --> IE{Erro?}
    IE -- Sim --> E2([500 FALHA_AO_CRIAR_COMENTARIO])
    IE -- Não --> OK([200 OK - comment criado com id])
```

## Extração de @menções — regex

```mermaid
flowchart LR
    IN[content: 'olá @joao.silva e @maria'] --> R1[content.match /@[\w]+/g]
    R1 --> R2["['@joao.silva', '@maria']"]
    R2 --> R3[.map m => m.slice 1]
    R3 --> OUT["['joao.silva', 'maria']"]
    OUT --> DB[WHERE username IN list]
```

> ⚠️ Regex `\w` captura apenas letras, dígitos e underscore. Nomes com `.` (ponto) são aceitos pois `.` é `\w` em alguns locales, mas pode haver inconsistências. Username com hífen não seria capturado completamente.

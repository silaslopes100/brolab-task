# C4 — Nível 1: Contexto

> Gerado pelo Architect em: 2026-05-29 | doc_level: detalhado

---

## Descrição

O diagrama de contexto mostra o BrolabTask no centro, os usuários que interagem com o sistema e os sistemas externos dos quais ele depende.

---

## Diagrama

```mermaid
C4Context
    title BrolabTask — Diagrama de Contexto (C4 Nível 1)

    Person(membro, "Membro Regular", "Membro da equipe. Visualiza e gerencia tasks no board Kanban.")
    Person(admin, "Admin", "Membro com role ADMIN ou ADMIN_TOTAL. Gerencia equipe além de tasks.")

    System(brolabtask, "BrolabTask", "Gerenciador de tarefas estilo Kanban com tema terminal. Monolito Next.js com API Routes e SPA React.")

    System_Ext(supabase, "Supabase", "Backend-as-a-Service. Provê banco PostgreSQL, Storage de arquivos e Realtime WebSocket.")
    System_Ext(vercel, "Vercel", "Plataforma de deploy e hosting. Executa o Next.js e serve a aplicação globalmente.")
    System_Ext(v0dev, "v0.dev (Vercel AI)", "Plataforma de geração de código por IA. Usada para bootstrapping inicial do projeto.")

    Rel(membro, brolabtask, "Usa via browser", "HTTPS")
    Rel(admin, brolabtask, "Usa via browser (com privilégios adicionais)", "HTTPS")
    Rel(brolabtask, supabase, "Lê e escreve dados, armazena arquivos, recebe eventos", "HTTPS / WebSocket")
    Rel(vercel, brolabtask, "Hospeda e executa", "Build + Runtime")
    Rel(v0dev, brolabtask, "Gerou o código inicial (bootstrap)", "Geração única")
```

---

## Personas de Usuário

| Persona | Descrição | Frequência de Uso |
|---------|-----------|------------------|
| **Membro Regular** | Desenvolvedor, designer ou outro colaborador. Cria e move tasks, comenta, anexa arquivos. | Diário |
| **Admin** | Líder técnico ou gestor. Além das ações de membro, gerencia a equipe (criação e remoção de membros). | Diário |

> 🟡 INFERIDO — Persona de Admin inferida a partir do campo `isAdmin` e das funcionalidades de `TeamAdminModal`. Não há documentação explícita de personas no projeto.

---

## Sistemas Externos

| Sistema | Papel | Protocolo | Confiança |
|---------|-------|-----------|-----------|
| **Supabase** | Banco de dados PostgreSQL, armazenamento de arquivos (S3-compat), notificações em tempo real (WebSocket) | HTTPS + WSS | 🟢 CONFIRMADO |
| **Vercel** | Hosting da aplicação Next.js, CI/CD automático por push no `main` | HTTPS / Git | 🟢 CONFIRMADO |
| **v0.dev** | Geração inicial do código (bootstrap histórico — não há dependência em runtime) | — | 🟢 CONFIRMADO |
| **@vercel/analytics** | Telemetria de uso da aplicação | HTTPS | 🟢 CONFIRMADO (dependência em `package.json`) |

---

## Contexto de Segurança

> ⚠️ **Ausência de boundary de segurança:** Não há autenticação nos endpoints de API. O sistema Supabase é acessado com service role (sem RLS). Qualquer agente externo que conheça as rotas de API tem acesso irrestrito aos dados.

# Dependências — BrolabTask

> Gerado pelo Scout em: 2026-05-29 | Fonte: `package.json`

---

## Gerenciador de Pacotes

| Gerenciador | Arquivo de lock |
|-------------|----------------|
| **Bun** (primário) | `bun.lock` |
| pnpm (secundário) | `pnpm-lock.yaml` |
| npm (deploy Vercel) | `package-lock.json` |

> 🟡 **INFERIDO** — O script `dev` usa `bunx next dev`; o deploy Vercel usa `npm install`. Ambiente de desenvolvimento e produção usam gerenciadores diferentes.

---

## Dependências de Produção

### Framework e Runtime

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `next` | 16.2.6 | Framework React full-stack (App Router) |
| `react` | ^19 | Biblioteca UI |
| `react-dom` | ^19 | Renderizador DOM para React |

### Backend / Dados

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `@supabase/ssr` | ^0.10.3 | Cliente Supabase para SSR (server + client components) |

### UI — Radix UI (Primitivos Acessíveis)

| Pacote | Versão |
|--------|--------|
| `@radix-ui/react-accordion` | 1.2.12 |
| `@radix-ui/react-alert-dialog` | 1.1.15 |
| `@radix-ui/react-aspect-ratio` | 1.1.8 |
| `@radix-ui/react-avatar` | 1.1.11 |
| `@radix-ui/react-checkbox` | 1.3.3 |
| `@radix-ui/react-collapsible` | 1.1.12 |
| `@radix-ui/react-context-menu` | 2.2.16 |
| `@radix-ui/react-dialog` | 1.1.15 |
| `@radix-ui/react-dropdown-menu` | 2.1.16 |
| `@radix-ui/react-hover-card` | 1.1.15 |
| `@radix-ui/react-label` | 2.1.2 |
| `@radix-ui/react-menubar` | 1.1.16 |
| `@radix-ui/react-navigation-menu` | 1.2.14 |
| `@radix-ui/react-popover` | 1.1.15 |
| `@radix-ui/react-progress` | 1.1.8 |
| `@radix-ui/react-radio-group` | 1.3.8 |
| `@radix-ui/react-scroll-area` | 1.2.10 |
| `@radix-ui/react-select` | 2.2.6 |
| `@radix-ui/react-separator` | 1.1.8 |
| `@radix-ui/react-slider` | 1.3.6 |
| `@radix-ui/react-slot` | 1.2.4 |
| `@radix-ui/react-switch` | 1.2.6 |
| `@radix-ui/react-tabs` | 1.1.13 |
| `@radix-ui/react-toast` | 1.2.15 |
| `@radix-ui/react-toggle` | 1.1.10 |
| `@radix-ui/react-toggle-group` | 1.1.11 |
| `@radix-ui/react-tooltip` | 1.2.8 |

### UI — Utilitários e Componentes

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `class-variance-authority` | ^0.7.1 | Variantes de componentes (CVA) — base do shadcn/ui |
| `clsx` | ^2.1.1 | Composição condicional de classes CSS |
| `tailwind-merge` | ^3.3.1 | Merge de classes Tailwind sem conflitos |
| `lucide-react` | ^0.564.0 | Biblioteca de ícones SVG |
| `next-themes` | ^0.4.6 | Suporte a tema claro/escuro |
| `cmdk` | 1.1.1 | Command palette (base do componente `command`) |
| `embla-carousel-react` | 8.6.0 | Carousel/slider |
| `input-otp` | 1.4.2 | Componente OTP input |
| `react-resizable-panels` | ^2.1.7 | Painéis redimensionáveis |
| `vaul` | ^1.1.2 | Drawer/bottom-sheet animado |
| `sonner` | ^1.7.1 | Toast notifications (Sonner) |

### Formulários e Validação

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `react-hook-form` | ^7.54.1 | Gerenciamento de formulários performático |
| `@hookform/resolvers` | ^3.9.1 | Resolvers para validação (Zod, Yup etc.) |
| `zod` | ^3.24.1 | Schema validation e type inference |

### Gráficos e Dados

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `recharts` | 2.15.0 | Biblioteca de gráficos (base do componente `chart`) |
| `date-fns` | 4.1.0 | Utilitários de data |
| `react-day-picker` | 9.13.2 | Componente de calendário/seleção de datas |

### Analytics e Fontes

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `@vercel/analytics` | 1.6.1 | Analytics Vercel |
| `@fontsource/jetbrains-mono` | ^5.2.8 | Fonte JetBrains Mono (self-hosted) |

---

## Dependências de Desenvolvimento

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `typescript` | 5.7.3 | Compilador TypeScript |
| `@types/node` | ^22 | Tipos Node.js |
| `@types/react` | ^19 | Tipos React |
| `@types/react-dom` | ^19 | Tipos React DOM |
| `tailwindcss` | ^4.2.0 | Framework CSS utilitário |
| `@tailwindcss/postcss` | ^4.2.0 | Plugin PostCSS para Tailwind 4 |
| `postcss` | ^8.5 | Processador CSS |
| `tw-animate-css` | 1.3.3 | Animações CSS para Tailwind |
| `autoprefixer` | ^10.4.20 | Auto-prefixador CSS (PostCSS) |

---

## Resumo de Dependências

| Categoria | Quantidade |
|-----------|-----------|
| Produção | ~45 |
| Desenvolvimento | ~9 |
| **Total** | **~54** |

---

## Notas Técnicas

> 🟡 **INFERIDO** — Supabase JS client (`@supabase/supabase-js`) não está listado explicitamente no `package.json`, mas é usado como dependência transitiva de `@supabase/ssr` e também importado diretamente em `lib/supabase/admin.ts` via `createClient`. Verificar se está instalado via `bun.lock`.

> 🟢 **CONFIRMADO** — Stack React 19 + Next.js 16 é bleeding-edge. Pode haver incompatibilidades com alguns pacotes Radix UI que ainda não foram atualizados para React 19 (verificar warnings no install).

> 🟡 **INFERIDO** — `autoprefixer` listado como devDependency, mas Tailwind 4 geralmente não requer mais autoprefixer separado. Pode ser um legado.

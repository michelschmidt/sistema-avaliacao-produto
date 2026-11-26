# Sistema de Avaliação de Produtos

Módulo de engajamento. Arquitetura em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), funcionalidades em [`specs/`](specs/) e planos de implementação em [`plans/`](plans/).

## Setup

1. Instale as dependências:
   ```bash
   bun install
   ```
2. Crie um projeto no [Supabase](https://supabase.com) e rode, **nesta ordem**, no **SQL Editor**:
   1. `supabase/migrations/20261120000000_create_accounts.sql`
   2. `supabase/migrations/20261125000000_create_products.sql`
   3. `supabase/migrations/20261126000000_create_products_feedbacks.sql`
   4. `supabase/migrations/20261127000000_add_products_ai_summary.sql`
3. Copie `.env.example` para `.env.local` e preencha:
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API)
   - `SESSION_SECRET` (gere com `openssl rand -base64 32`)
   - `OPENAI_API_KEY` (resumo de IA das avaliações; a conta precisa ter créditos)
4. Rode o projeto:
   ```bash
   bun dev
   ```
   Acesse http://localhost:3000

## Scripts

| Comando | O que faz |
|---|---|
| `bun dev` | Servidor de desenvolvimento |
| `bun run build` | Build de produção |
| `bun run lint` | Lint + formatação (Biome) |
| `bun run format` | Formata o código |
| `bun scripts/seed-products.ts` | Cadastra 30 produtos de exemplo (com `bun dev` rodando; base em `SEED_BASE_URL`) |
| `bun --conditions=react-server scripts/backfill-ai-summaries.ts` | Gera o resumo de IA dos produtos que já têm avaliações |

## Páginas

| Rota | Descrição |
|---|---|
| `/` | Vitrine de produtos com scroll infinito (pública) |
| `/products/[id]` | Detalhes, resumo de IA, avaliações e formulário (avaliar exige login) |
| `/auth/sign-up` | Criação de conta |
| `/auth/sign-in` | Login (aceita `?next=/caminho` para voltar à página de origem) |

## API REST

| Método | Rota | Corpo | Respostas |
|---|---|---|---|
| `POST` | `/api/v1/sign-up` | `{ firstName, lastName, email, password, confirmPassword }` | `200`, `400`, `500` |
| `POST` | `/api/v1/sign-in` | `{ email, password }` | `200` (cria cookie de sessão), `400`, `401`, `500` |
| `GET` | `/api/v1/products?cursor=&limit=` | — | `200` `{ items, nextCursor }`, `400`, `500` |
| `POST` | `/api/v1/products` | `{ name, imageUrl, externalLink?, description? }` | `200` `{ product }`, `400`, `500` |
| `POST` | `/api/v1/products/:id/feedbacks` | `{ score (1–5), comment }` — exige cookie de sessão | `200`, `400`, `401`, `404`, `500` |

Notas:
- `POST /api/v1/products` é aberto (sem autenticação, projeto de estudo). `externalLink` que não seja URL `http(s)` completa (vazio, ausente, ou caminho como `/shampoo`) é salvo como `https://www.amazon.com.br/blackfriday`. `imageUrl` precisa ser URL `http(s)`.
- Toda a lógica vive em procedures tRPC (`/api/trpc/*`), usadas pela interface; as rotas REST são adaptadores finos.

## Resumo de IA

Agente Mastra (`src/mastra/agents/review-summary-agent.ts`, modelo `openai/gpt-4.1-mini`). A cada nova avaliação, depois de responder ao usuário, o servidor regera o resumo do produto (a partir de 2 avaliações) e o salva em `products.ai_summary`. A página de detalhes consulta o resumo por alguns segundos até ele ficar pronto. Falhas da IA não afetam a publicação da avaliação.

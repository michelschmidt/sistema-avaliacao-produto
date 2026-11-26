# Orquestração — execução paralela de sign-in, home e feedback

As três features se cruzam (feedback precisa da sessão do sign-in e da tabela `products` da home; todas mexem no router tRPC e no layout). Para rodar **3 subagents em paralelo sem conflito**, o orquestrador faz uma fundação curta antes, e cada subagent só escreve nos arquivos que são dele.

## Fase 0 — Fundação (orquestrador, antes de subir os subagents)
Contratos compartilhados, pequenos e estáveis:

| Arquivo | Conteúdo |
|---|---|
| `package.json` | `bun add jose` |
| `.env.example` / `.env.local` | `SESSION_SECRET` (gerado com `openssl rand -base64 32` no `.env.local`) |
| `src/server/auth/session.ts` | `createSession(accountId)`, `getSession(): { accountId } \| null`, `deleteSession()` — JWT HS256 com `jose`, cookie `avalia_session` |
| `src/server/trpc.ts` | `createTRPCContext` → `{ session }`; novo `protectedProcedure` (`UNAUTHORIZED` sem sessão) |
| `src/server/routers/_app.ts` | Registra `auth`, `products`, `feedbacks` |
| `src/server/routers/products.ts`, `feedbacks.ts` | Routers vazios (`createTRPCRouter({})`) para os subagents preencherem |
| `src/server/db/products.ts` | Tipo `Product`, mapper de linha e `findProductById(id)` (home adiciona list/insert) |
| `src/app/(platform)/layout.tsx` | Layout base com cabeçalho; slot `<Suspense><HeaderUser/></Suspense>` |
| `src/app/(platform)/_components/header-user.tsx` | Stub (sign-in implementa) |
| `src/app/(platform)/page.tsx` | Stub da home (substitui `src/app/page.tsx`; home implementa) |

Critério de saída da Fase 0: `bun run lint` e `bun run build` passam.

## Fase 1 — Subagents em paralelo
Cada plano tem a seção **"Escopo do subagent"** com os arquivos que ele pode criar/editar. Regras para todos:
- Não editar arquivos fora da própria lista; se precisar, reportar ao orquestrador.
- Não editar `README.md` (o orquestrador consolida).
- Não rodar `bun add` (dependências já instaladas na Fase 0).
- Ao terminar: rodar `bun run lint` nos próprios arquivos e reportar arquivos alterados, decisões e pendências.
- `bun run build` completo só na Fase 2 (builds simultâneos competem pela pasta `.next`).

## Fase 2 — Integração (orquestrador)
1. Revisar os diffs de cada subagent contra o seu plano.
2. `bun run lint` + `bun run build`.
3. **Você aplica as 2 migrations no SQL Editor do Supabase** (products → products_feedbacks); o projeto não usa Supabase CLI.
4. Teste ponta a ponta: seed de produtos → home com scroll → sign-in → detalhes → nova avaliação → estado deslogado. Endpoints via `curl` (códigos 200/400/401/404).
5. Screenshots para revisão de design.
6. Atualizar `README.md` (endpoints, env, migrations) e `design-notes`.

## Decisões a aprovar antes de começar
Os pontos em aberto de cada plano (seção "Pontos para você confirmar") afetam os contratos, principalmente o **`score`** (home #1 / feedback #1) e o **`?next=`** (feedback #2, implementado pelo subagent do sign-in).

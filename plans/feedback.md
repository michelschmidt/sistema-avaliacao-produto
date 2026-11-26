# Plano — Feedback (Avaliações de produto)

> Spec: [`specs/feedback.md`](../specs/feedback.md) · Ordem de execução: **3 de 3** (depende da sessão do sign-in e da tabela `products` da home)

## Objetivo
Criar a página pública de detalhes `/products/[id]` com informações do produto + avaliações existentes, e permitir que **pessoas logadas** adicionem uma avaliação (nota 1–5 + comentário).

## Decisões técnicas
| Tema | Decisão | Por quê |
|---|---|---|
| Rota | `src/app/(platform)/products/[id]/page.tsx` | Herda o cabeçalho do layout base |
| Dados do produto | Server Component com `use cache` + `cacheTag("product:{id}")` | Página pública; entra no static shell rápido |
| Lista de avaliações | Query tRPC `feedbacks.listByProduct` no cliente (ordem: mais recentes primeiro) | Após criar avaliação basta invalidar a query — a nova aparece na hora |
| Bloco de login vs. formulário | Componente que lê a sessão dentro de `<Suspense>` | Exigência do `cacheComponents` |
| Criação | `protectedProcedure` `feedbacks.create` (sessão vem do contexto, nunca do body); REST `POST /api/v1/products/[id]/feedbacks` como adaptador fino | Padrão do projeto; `created_by` não pode ser forjado |
| Autor exibido | Join com `accounts` → `first_name` + inicial do sobrenome + avatar DiceBear | Não expõe email publicamente |
| Formulário | React Hook Form + Zod; seletor de 5 estrelas acessível (radio group, navegável por teclado) + textarea | Reaproveita o componente `Stars` de `review-panel.tsx` |

## Banco de dados
Migration `supabase/migrations/20261126000000_create_products_feedbacks.sql`:
```sql
create table if not exists public.products_feedbacks (
  id          text primary key,                                         -- nanoid
  score       int  not null check (score between 1 and 5),
  comment     text not null,
  created_at  timestamptz not null default now(),
  created_by  text not null references public.accounts(id),
  product_id  text not null references public.products(id) on delete cascade
);
create index if not exists products_feedbacks_product_idx
  on public.products_feedbacks (product_id, created_at desc);
alter table public.products_feedbacks enable row level security;   -- só service_role
```
(Os tipos "nanoid" da spec viram `text`, como em `accounts.id`.)

## Passos

### Back-end
1. `src/lib/validations/feedbacks.ts`: `createFeedbackSchema` → `productId`, `score` (int 1–5, mensagem "Escolha uma nota de 1 a 5"), `comment` (trim, 1–1000).
2. `src/server/db/products.ts`: `findProductById(id)`.
3. `src/server/db/feedbacks.ts`: `listFeedbacksByProduct(productId)` (com autor via join) e `insertFeedback(...)`.
4. `src/server/routers/feedbacks.ts`:
   - `listByProduct` (public query).
   - `create` (protected mutation): valida que o produto existe (`NOT_FOUND` → 404), gera `nanoid()`, `created_by = ctx.session.accountId`, chama `revalidateTag/updateTag("product:{id}")` se a média for exibida.
   - Registrar em `_app.ts`; `products.byId` (query) para o REST/cliente se necessário.
5. `src/app/api/v1/products/[id]/feedbacks/route.ts` — `POST` JSON `{ score, comment }`: `200` `{ feedback }`, `400` inválido, `401` sem sessão, `404` produto inexistente, `500` inesperado.

### Front-end
6. `page.tsx` — produto inexistente → `notFound()`. Layout: imagem, nome, descrição, link externo ("Ver produto" em nova aba, `rel="noopener noreferrer"`), média/contagem de notas.
7. `_components/feedback-list.tsx` (client): lista de avaliações com estrelas, comentário em Newsreader (serifa de leitura, como no painel do sign-up), autor e data relativa (`date-fns` `formatDistanceToNow`, locale `ptBR`); estado vazio "Seja a primeira pessoa a avaliar".
8. `_components/feedback-gate.tsx` (server, em Suspense):
   - sem sessão → bloco "Entre para avaliar" com botões **Entrar** / **Criar conta** (link de volta via `?next=/products/{id}` — ver ponto #2);
   - com sessão → `<FeedbackForm productId />`.
9. `_components/feedback-form.tsx` (client): estrelas + textarea + contador de caracteres; erro da API em `Alert` vermelho; no sucesso limpa o form, invalida `feedbacks.listByProduct` e mostra confirmação breve.
10. Design via skill frontend-design: a nota em estrelas Selo (marigold) é o elemento de destaque; uma única animação (`star-pop` já existente) ao escolher a nota; respeitar reduced motion.

### Documentação
11. README: nova rota, endpoint e migration.

## Arquivos
- **Novos:** migration, `src/lib/validations/feedbacks.ts`, `src/server/db/feedbacks.ts`, `src/server/routers/feedbacks.ts`, `src/app/api/v1/products/[id]/feedbacks/route.ts`, `src/app/(platform)/products/[id]/page.tsx` + `_components/` (`feedback-list`, `feedback-gate`, `feedback-form`, `star-input`)
- **Alterados:** `src/server/db/products.ts`, `src/server/routers/_app.ts`, possivelmente `src/server/routers/products.ts`, `README.md`

## Critérios de aceitação → verificação
| Critério | Como verificar |
|---|---|
| Detalhes do produto + avaliações + formulário | Logado em `/products/{id}`: vê infos, lista e form |
| Público sem autenticação | Aba anônima vê produto e avaliações, e o bloco "Entre para avaliar" no lugar do form |
| Endpoint de criação | `curl` sem cookie → `401`; com cookie e nota 6 → `400`; válido → `200` e aparece na lista |
| Produto inexistente | `/products/xyz` → página 404 |
| Qualidade | `bun run lint` e `bun run build` sem erros |

## Escopo do subagent (execução paralela)
A Fase 0 ([`_orquestracao.md`](_orquestracao.md)) já entrega: `getSession()`, `protectedProcedure`, router `feedbacks` vazio registrado em `_app.ts` e `findProductById` em `src/server/db/products.ts`. O passo 2 já chega pronto. Como a tabela `products` vem do subagent da home em paralelo, este subagent desenvolve contra o tipo `Product` da Fase 0, e o teste com dados reais acontece na Fase 2.

**Pode criar/editar:**
- `supabase/migrations/20261126000000_create_products_feedbacks.sql`
- `src/lib/validations/feedbacks.ts`
- `src/server/db/feedbacks.ts` (inclui recalcular `products.score` se o ponto #1 for aprovado)
- `src/server/routers/feedbacks.ts`
- `src/app/api/v1/products/[id]/feedbacks/route.ts`
- `src/app/(platform)/products/[id]/**`

**Não toca:** `db/products.ts`, `routers/products.ts`, `_app.ts`, `trpc.ts`, `session.ts`, `auth/**`, README. Os links "Entrar/Criar conta" usam `?next=` (implementado pelo subagent do sign-in).

## Fora do escopo
- Editar/excluir avaliações, curtidas, respostas, moderação, paginação de avaliações, limitar uma avaliação por pessoa.

## Pontos para você confirmar
1. **Média do produto:** depende da decisão do plano home sobre `score`. Se aprovar `numeric` como média, recalculo `products.score` a cada nova avaliação (no `feedbacks.create`). Ok?
2. **Voltar após login:** adicionar suporte a `?next=` no sign-in para retornar à página do produto. É uma pequena mudança no fluxo de sign-in — incluir?
3. **Comentário obrigatório?** A spec diz "nota + comentário"; planejei os dois obrigatórios.

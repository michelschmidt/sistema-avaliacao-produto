# Plano — Home (Listagem de produtos)

> Spec: [`specs/home.md`](../specs/home.md) · Ordem de execução: **2 de 3** (usa o layout base criado no sign-in; o feedback depende da tabela `products`)

## Objetivo
Listar publicamente todos os produtos na home, com paginação por infinite scrolling, e oferecer um endpoint para cadastrar produtos manualmente.

## Decisões técnicas
| Tema | Decisão | Por quê |
|---|---|---|
| Paginação | **Cursor** por `(created_at desc, id desc)`, `limit` padrão 12 (máx. 50) | Estável enquanto novos produtos entram; sem `OFFSET` |
| Infinite scroll | `useInfiniteQuery` com `trpc.products.list.infiniteQueryOptions` + `IntersectionObserver` num "sentinela" no fim da lista | Integração nativa tRPC + TanStack Query já configurada |
| Primeira página | Carregada no cliente com skeletons (a sessão no cabeçalho já está em Suspense) | Simples; prefetch no servidor fica como melhoria |
| Imagem | Coluna **`image_url text`** (URL externa) — a spec pede imagem no POST mas não lista coluna | Menor caminho; upload para Supabase Storage fica como melhoria |
| Exibição de imagem | `<img>` com `loading="lazy"`, `aspect-ratio` fixo e fallback quando ausente/quebrada | URLs arbitrárias não cabem em `remotePatterns` do `next/image` |
| API | tRPC `products.list` (query) e `products.create` (mutation); REST `GET /api/v1/products` e `POST /api/v1/products` como adaptadores finos | Padrão do projeto |

## Banco de dados
Migration `supabase/migrations/20261125000000_create_products.sql`:
```sql
create table if not exists public.products (
  id             text primary key,               -- nanoid gerado na API
  name           text        not null,
  description    text,                           -- opcional
  image_url      text,                           -- (adição: imagem do produto)
  external_link  text        not null,
  score          numeric(2,1),                   -- ver "Pontos para confirmar" #1
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists products_created_at_id_idx on public.products (created_at desc, id desc);
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();   -- função já existe
alter table public.products enable row level security;      -- só service_role
```

## Passos

### Back-end
1. `src/lib/validations/products.ts`:
   - `listProductsSchema`: `cursor` opcional (string opaca base64 de `created_at|id`), `limit` 1–50.
   - `createProductSchema`: `name` (1–200), `description` opcional (≤ 1000), `externalLink` (URL http/https), `imageUrl` (URL http/https).
2. `src/server/db/products.ts`: `listProducts({ cursor, limit })` (busca `limit + 1` para saber se há próxima página) e `insertProduct(...)`. Mapeia snake_case → camelCase.
3. `src/server/routers/products.ts`: `list` → `{ items, nextCursor }`; `create` → gera `nanoid()` e retorna o produto. Registrar em `_app.ts`.
4. `src/app/api/v1/products/route.ts`:
   - `GET ?cursor=&limit=` → `200` com `{ items, nextCursor }` (array vazio quando não houver produtos); `400` parâmetros inválidos.
   - `POST` JSON `{ name, externalLink, imageUrl, description? }` → `200` `{ product }`; `400`; `500`.
5. Script de seed opcional `scripts/seed-products.ts` (via `bun`) chamando o POST, para popular a home e testar o scroll.

### Front-end
6. `src/app/(platform)/page.tsx` — substitui o esqueleto do sign-in: título + `<ProductGrid/>`.
7. `_components/product-grid.tsx` (client): `useInfiniteQuery`, grid responsivo (1/2/3 colunas), sentinela com `IntersectionObserver` (`rootMargin` ~400px para carregar antes do fim), estados:
   - carregando → cards skeleton;
   - vazio → mensagem amigável;
   - erro → alert com botão "Tentar novamente";
   - fim da lista → indicador discreto.
8. `_components/product-card.tsx`: imagem, **nome como `<Link href="/products/{id}">`** (página criada no plano feedback; até lá dá 404), descrição curta com `line-clamp-2`.
9. Design via skill frontend-design, mantendo a identidade "Avalia"; evitar o kit de cards SaaS idênticos (ver `design-notes`). Respeitar `prefers-reduced-motion`.

### Documentação
10. README: novos endpoints e nova migration no setup.

## Arquivos
- **Novos:** migration, `src/lib/validations/products.ts`, `src/server/db/products.ts`, `src/server/routers/products.ts`, `src/app/api/v1/products/route.ts`, `src/app/(platform)/_components/product-grid.tsx`, `product-card.tsx`, `scripts/seed-products.ts`
- **Alterados:** `src/server/routers/_app.ts`, `src/app/(platform)/page.tsx`, `README.md`

## Critérios de aceitação → verificação
| Critério | Como verificar |
|---|---|
| Home lista todos os produtos, pública | Aba anônima em `/` mostra os cards |
| Infinite scroll | Com 30+ produtos seedados, rolar carrega novas páginas sem duplicar/pular |
| `GET /api/v1/products` | `200` com itens; `200` com `[]` em tabela vazia |
| `POST /api/v1/products` | Cria produto (`200`), dados inválidos → `400` |
| Clique no nome navega | Vai para `/products/{id}` |
| Qualidade | `bun run lint` e `bun run build` sem erros |

## Escopo do subagent (execução paralela)
A Fase 0 ([`_orquestracao.md`](_orquestracao.md)) já entrega: router `products` vazio registrado em `_app.ts`, `src/server/db/products.ts` com o tipo `Product` + mapper + `findProductById`, e a página stub `(platform)/page.tsx`.

**Pode criar/editar:**
- `supabase/migrations/20261125000000_create_products.sql`
- `src/lib/validations/products.ts`
- `src/server/db/products.ts`: **apenas adicionar** `listProducts` e `insertProduct` (sem alterar o tipo `Product` nem `findProductById`)
- `src/server/routers/products.ts` (`list`, `create`)
- `src/app/api/v1/products/route.ts`
- `src/app/(platform)/page.tsx`, `src/app/(platform)/_components/product-*.tsx`
- `scripts/seed-products.ts`

**Não toca:** `_app.ts`, `trpc.ts`, `(platform)/layout.tsx`, `header-*`, `products/[id]/**`, README.

## Fora do escopo
- Busca, filtros, ordenação customizada, edição/remoção de produtos, upload de arquivo, proteção do POST.

## Pontos para você confirmar
1. **`score: boolean`** na spec parece engano (score é nota). Proposta: `score numeric(2,1)` nulo = **média das avaliações**, atualizada no plano feedback e exibida no card. Alternativas: manter boolean literal, ou remover a coluna e calcular a média na consulta. Qual prefere?
2. **Imagem:** ok usar `image_url` (URL externa) em vez de upload?
3. **POST `/products`:** a spec escreve `/products`; vou usar `/api/v1/products` para seguir o padrão. Ok? E o POST fica **aberto** (sem autenticação) por ser projeto de estudo — ok?

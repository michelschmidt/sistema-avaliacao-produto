-- Avaliações de produtos (nota 1–5 + comentário).
-- Depende de 20261120000000_create_accounts.sql e 20261125000000_create_products.sql.
create table if not exists public.products_feedbacks (
  id          text        primary key,                                  -- nanoid gerado na API
  score       int         not null check (score between 1 and 5),
  comment     text        not null check (char_length(comment) between 1 and 1000),
  created_at  timestamptz not null default now(),
  created_by  text        not null references public.accounts(id),       -- sempre da sessão, nunca do body
  product_id  text        not null references public.products(id) on delete cascade
);

-- Lista de avaliações de um produto, mais recentes primeiro.
create index if not exists products_feedbacks_product_idx
  on public.products_feedbacks (product_id, created_at desc);

-- RLS ligado e sem policies: anon/authenticated não acessam nada.
-- Apenas o servidor (service_role) lê e escreve nesta tabela.
alter table public.products_feedbacks enable row level security;

-- Tabela de produtos listados na home (feature home).
create table if not exists public.products (
  id             text primary key,               -- nanoid gerado na API
  name           text        not null,
  description    text,                           -- opcional
  image_url      text,                           -- URL externa da imagem do produto
  external_link  text        not null,
  score          numeric(2,1),                   -- média das avaliações (1.0–5.0); null = sem avaliações
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Paginação por cursor na home: ordem (created_at desc, id desc).
create index if not exists products_created_at_id_idx
  on public.products (created_at desc, id desc);

-- Mantém updated_at sempre atualizado (função criada na migration de accounts).
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- RLS ligado e sem policies: apenas o servidor (service_role) lê e escreve.
alter table public.products enable row level security;

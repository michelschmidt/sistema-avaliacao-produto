-- Tabela de contas (autenticação própria, sem Supabase Auth)
create table if not exists public.accounts (
  id          text primary key,                    -- nanoid gerado na API
  first_name  text        not null,
  last_name   text        not null,
  email       text        not null,                 -- sem UNIQUE por enquanto (ver specs/sign-up.md → Melhorias futuras)
  password    text        not null,                 -- hash bcrypt (o salt fica embutido no hash)
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Mantém updated_at sempre atualizado
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

-- RLS ligado e sem policies: anon/authenticated não acessam nada.
-- Apenas o servidor (service_role) lê e escreve nesta tabela.
alter table public.accounts enable row level security;

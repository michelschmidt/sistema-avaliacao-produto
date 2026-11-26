
# Arquitetura do Projeto

## Front-End
Vamos utilizar as seguintes bibliotecas principais:
- Next.js (App Router): Framework para criação e gestão das interfaces.
- React.js: Biblioteca para criação e componentização de interfaces.
- Biome: Validação/Formatação/correção de código (lint).
- TailwindCSS: Estilização.
- Date-FNS: Manipulação de data/hora.
- Shadcn/ui: Componentização base (design system).
- React Query (TanStack Query): Criação e gestão de queries para ler dados da API e mutations para alterar dados (integrado ao tRPC).
- React Hook Form: Gestão e validação de formulários (via `@hookform/resolvers/zod`).

## Back-End
Vamos utilizar as seguintes bibliotecas principais:
- TypeScript: Linguagem principal de desenvolvimento com tipagem.
- Next.js (Route Handlers): Framework para criação das APIs.
- tRPC: Gestão de endpoints (fonte única da lógica de negócio).
- Zod: Schemas de validação compartilhados entre cliente e servidor.
- bcryptjs: Hash de senha com bcrypt (o salt é gerado automaticamente e embutido no próprio hash).
- nanoid: Geração de IDs.
- Mastra.ai: Criação e customização de agentes internos.

## Padrão de API
- Toda lógica de negócio fica em **procedures tRPC** (`src/server/routers/*`).
- O front-end consome a API via **cliente tRPC + React Query** (type-safe, sem duplicar tipos).
- Quando a spec exigir um endpoint REST público (ex.: `POST /api/v1/sign-up`), criamos um
  **Route Handler fino** em `src/app/api/v1/...` que apenas chama a mesma procedure via
  `createCaller` e traduz o resultado/erro em status HTTP. Assim não há lógica duplicada.

## Banco de dados
Supabase: PostgreSQL.
- Autenticação **própria** (tabela `accounts`), sem uso do Supabase Auth.
- Acesso somente pelo servidor, usando `@supabase/supabase-js` com a `service_role key`
  (nunca exposta ao cliente). RLS habilitado sem policies públicas.
- Migrations versionadas em SQL (`supabase/migrations`).

## Infraestrutura
Vercel: Hospedar tanto o servidor (API) quanto o cliente.

## Ferramentas
- Bun: Gerenciador de pacotes e execução de scripts em desenvolvimento.

## Automação
N8N: Criação de fluxos automatizados.

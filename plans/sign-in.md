# Plano — Sign-In (Autenticação)

> Spec: [`specs/sign-in.md`](../specs/sign-in.md) · Ordem de execução: **1 de 3** (home e feedback dependem da sessão criada aqui)

## Objetivo
Permitir que uma pessoa com conta entre com email + senha, criar uma sessão via cookie e refletir o estado de login no cabeçalho de um layout base da plataforma.

## Decisões técnicas
| Tema | Decisão | Por quê |
|---|---|---|
| Sessão | JWT assinado (HS256) com **`jose`**, guardado em cookie `avalia_session` (`httpOnly`, `secure` em produção, `sameSite: lax`, `path: /`, expira em 7 dias) | Padrão recomendado no guia `authentication.md` do Next 16; stateless, sem tabela extra |
| Payload da sessão | Apenas `{ accountId }` | O guia recomenda não colocar PII no token; nome/email são lidos do banco |
| Segredo | Nova env `SESSION_SECRET` (`openssl rand -base64 32`) em `.env.example` / `.env.local` | — |
| Lógica de negócio | Procedure tRPC `auth.signIn`; `POST /api/v1/sign-in` é adaptador fino (mesmo padrão do sign-up) | Segue `docs/ARCHITECTURE.md` |
| Contexto tRPC | `createTRPCContext` passa a ler a sessão (`cookies()`) e expor `session`; cria-se `protectedProcedure` | Será reutilizado em feedback |
| Leitura da sessão no layout | Componente do cabeçalho que lê o cookie fica dentro de `<Suspense>` | Com `cacheComponents: true`, ler `cookies()` fora de Suspense é erro de build (guia `authentication-with-cache-components.md`) |
| Avatar | `<img>` com DiceBear (`https://api.dicebear.com/9.x/initials/svg?seed=<nome>`) | SVG externo; usar `<img>` evita `dangerouslyAllowSVG` no `next/image` |
| Timing attack | Se o email não existir, comparar com um hash bcrypt "dummy" | Resposta 401 leva o mesmo tempo existindo ou não a conta (custo baixo, sem sair do escopo) |

## Passos

### Back-end
1. `bun add jose`.
2. `src/lib/validations/sign-in.ts` — schema Zod compartilhado: `email` (trim, lowercase, formato válido), `password` (obrigatória, 1–72).
3. `src/server/db/accounts.ts` — adicionar:
   - `findAccountByEmail(email)` → retorna `id`, `password`, `active` (uso interno, nunca sai da API).
   - `findPublicAccountById(id)` → `PublicAccount` (sem senha).
   - Como não há `UNIQUE` em email, usar o registro mais recente (`order created_at desc limit 1`) — anotar em "Melhorias futuras".
4. `src/server/auth/session.ts` (`server-only`) — `createSession(accountId)`, `getSession()`, `deleteSession()` com `jose` + `cookies()`.
5. `src/server/trpc.ts` — `createTRPCContext` retorna `{ session }`; novo `protectedProcedure` que lança `UNAUTHORIZED` sem sessão.
6. `src/server/routers/auth.ts` — `signIn` (mutation):
   - busca conta por email → `bcrypt.compare` (ou dummy) → se falhar ou `active = false`: `TRPCError UNAUTHORIZED` com mensagem **"Email ou senha inválidos."**
   - sucesso: `createSession(account.id)` e retorna `PublicAccount`.
   - `me` (query): retorna a conta pública da sessão ou `null`.
7. `src/app/api/v1/sign-in/route.ts` — `POST`: JSON inválido/validação → `400`; `UNAUTHORIZED` → `401`; erro inesperado → `500`; sucesso → `200` com `{ account }` (cookie setado pela procedure).

### Front-end
8. `src/app/auth/sign-in/page.tsx` + `_components/sign-in-form.tsx` — React Hook Form + zodResolver, reaproveitando `password-input.tsx`, layout de `/auth` e o painel de review (mesma identidade visual do sign-up, conforme `design-notes`).
   - Erro da API → `Alert` vermelho (variant destructive) no topo do form com a mensagem genérica.
   - Sucesso → `router.push("/")` + `router.refresh()` para o cabeçalho reler a sessão.
   - Links cruzados: "Criar conta" ↔ "Entrar".
9. Layout base da plataforma: `src/app/(platform)/layout.tsx` (route group) com cabeçalho:
   - Logo "Avalia" à esquerda.
   - À direita, `<Suspense fallback={<skeleton do avatar/>}><HeaderUser/></Suspense>`:
     - sem sessão → botão "Entrar" (`/auth/sign-in`);
     - com sessão → avatar DiceBear + nome e sobrenome + email.
10. Home esqueleto: `src/app/(platform)/page.tsx` com título e blocos skeleton (substitui o `redirect("/auth/sign-up")` atual). Será preenchida no plano **home**.
11. Design: seguir a skill frontend-design (tokens existentes em `globals.css`: Tinta, Gesso, Selo, Grafite, Erro; Schibsted Grotesk + Newsreader). Revisar com screenshots.

### Documentação
12. Atualizar `README.md` (tabela de API, env `SESSION_SECRET`) e `.env.example`.

## Arquivos
- **Novos:** `src/lib/validations/sign-in.ts`, `src/server/auth/session.ts`, `src/app/api/v1/sign-in/route.ts`, `src/app/auth/sign-in/page.tsx`, `src/app/auth/sign-in/_components/sign-in-form.tsx`, `src/app/(platform)/layout.tsx`, `src/app/(platform)/page.tsx`, `src/app/(platform)/_components/header-user.tsx`
- **Alterados:** `src/server/trpc.ts`, `src/server/routers/auth.ts`, `src/server/db/accounts.ts`, `.env.example`, `README.md`, `package.json`
- **Removido:** `src/app/page.tsx` (movido para o route group)

## Critérios de aceitação → verificação
| Critério | Como verificar |
|---|---|
| Página `/auth/sign-in` com formulário validado | Enviar vazio / email inválido mostra erros por campo sem chamar a API |
| Comunicação com a API | `curl -X POST /api/v1/sign-in` → `200` com credenciais corretas, `401` erradas, `400` JSON inválido |
| Erro em alert vermelho | Senha errada exibe "Email ou senha inválidos." |
| Navega para `/` no sucesso | Após login, home carrega e cabeçalho mostra avatar + nome + email |
| Cabeçalho deslogado | Aba anônima mostra botão "Entrar" |
| Qualidade | `bun run lint` e `bun run build` sem erros |

## Escopo do subagent (execução paralela)
A Fase 0 do orquestrador ([`_orquestracao.md`](_orquestracao.md)) já entrega: `jose`, `SESSION_SECRET`, `src/server/auth/session.ts`, contexto + `protectedProcedure` em `trpc.ts`, `(platform)/layout.tsx` e as páginas stub. Ou seja, os passos 1, 4, 5 e a estrutura do passo 9 já chegam prontos.

**Pode criar/editar:**
- `src/lib/validations/sign-in.ts`
- `src/server/db/accounts.ts`
- `src/server/routers/auth.ts`
- `src/app/api/v1/sign-in/route.ts`
- `src/app/auth/sign-in/**`, `src/app/auth/_components/**`, `src/app/auth/layout.tsx`, link "Entrar" em `src/app/auth/sign-up/**`
- `src/app/(platform)/_components/header-user.tsx` (+ componentes de avatar/menu dentro de `(platform)/_components/header-*`)
- Estilo visual do cabeçalho em `src/app/(platform)/layout.tsx` (sem mudar o slot `<HeaderUser/>`)
- Suporte a `?next=` no sign-in (se aprovado no feedback #2), aceitando apenas caminhos internos começando com `/`

**Não toca:** `trpc.ts`, `session.ts`, `_app.ts`, `(platform)/page.tsx`, `products/**`, README.

## Fora do escopo
- Logout, "esqueci minha senha", envio de email, rate limiting.

## Pontos para você confirmar
1. **Logout:** a spec não pede. Sem ele, para testar o estado deslogado é preciso apagar o cookie/aba anônima. Sugiro **adicionar um item "Sair" mínimo** no menu do avatar — ok ou deixo de fora?
2. **Dependência nova `jose`** (recomendada pelo guia do Next). Ok?

# Plano — Resumo de IA das avaliações

> Pedido do usuário (2026-11-24): agente **Mastra + GPT-4 Mini** que recebe todos os comentários de um produto e gera um resumo geral, exibido em destaque como **IA** entre as informações do produto e as avaliações.
> Referência: https://mastra.ai/docs/agents/overview

## Objetivo
Cada produto com avaliações ganha um bloco "Resumo das avaliações · gerado por IA" na página `/products/[id]`, posicionado entre o cabeçalho do produto e a seção "Avaliações".

## Decisões técnicas
| Tema | Decisão | Por quê |
|---|---|---|
| Quando gerar | **Ao criar uma avaliação** (após responder ao usuário, via `after()` do Next) | Custo e latência só quando os comentários mudam; quem visita a página nunca espera a IA |
| Onde guardar | Novas colunas em `products`: `ai_summary text`, `ai_summary_updated_at timestamptz`, `ai_summary_feedback_count int` | Leitura instantânea junto com o produto, já no cache da página |
| Mínimo de avaliações | Gerar só com **≥ 2 avaliações** (ver ponto #2) | Resumo de um único comentário só repete o comentário |
| Agente | `@mastra/core` → `new Agent({ id: "review-summary", model: "openai/gpt-4o-mini", instructions })`, registrado em `new Mastra({ agents })` | Padrão da doc; sem pacote extra de provider (string `openai/<modelo>`) |
| Saída | `structuredOutput` com Zod: `{ summary: string }` (2–4 frases, pt-BR) | Resposta validada, sem texto extra do modelo |
| Entrada | Nota + comentário de cada avaliação (sem nomes), mais recentes primeiro, limitado a ~100 avaliações / ~20k caracteres | Controle de custo; nunca envia dados pessoais ao provedor |
| Segurança do prompt | Instruções dizem que os comentários são **dados**, não instruções; resposta só sobre o produto | Comentários são texto livre de usuários (prompt injection) |
| Falhas | Erro na IA é logado e ignorado: a avaliação continua salva e o resumo anterior permanece | A IA é um complemento, não pode quebrar o fluxo principal |
| Cache | Após salvar o resumo, `revalidateTag("product:{id}", { expire: 0 })` | Mesmo mecanismo já usado pela feature feedback |
| Next.js | `serverExternalPackages: ["@mastra/*"]` no `next.config.ts` | Recomendação da doc da Mastra para Next |
| Chave | `OPENAI_API_KEY` no `.env.local` (só servidor) e placeholder no `.env.example` | Variável que a Mastra lê automaticamente |

Ambiente verificado: Node v26 (a Mastra exige ≥ 22.13).

## Banco de dados
Migration `supabase/migrations/20261127000000_add_products_ai_summary.sql`:
```sql
alter table public.products
  add column if not exists ai_summary                text,
  add column if not exists ai_summary_updated_at     timestamptz,
  add column if not exists ai_summary_feedback_count int;
```

## Passos

### Back-end
1. `bun add @mastra/core`; `next.config.ts` com `serverExternalPackages`.
2. `src/mastra/agents/review-summary-agent.ts`: agente com instruções em pt-BR: tom neutro, destacar pontos positivos e negativos recorrentes, não inventar, não citar pessoas, 2–4 frases.
3. `src/mastra/index.ts`: instância `mastra` com o agente registrado (`server-only`).
4. `src/server/ai/summarize-reviews.ts`: monta o prompt com as avaliações, chama `generate(..., { structuredOutput })` e retorna o texto.
5. `src/server/db/products.ts`: estender `Product` com `aiSummary`, `aiSummaryUpdatedAt`, `aiSummaryFeedbackCount` (+ `PRODUCT_COLUMNS`, `toProduct`) e criar `updateProductAiSummary(id, summary, count)`.
6. `src/server/routers/feedbacks.ts`: em `create`, após salvar e revalidar, agendar `after(() => refreshAiSummary(productId))`. Isso vale tanto para o tRPC quanto para o REST.
7. `scripts/backfill-ai-summaries.ts`: gera resumos para produtos que já têm avaliações (rodado uma vez, manualmente).

### Front-end
8. `src/app/(platform)/products/[id]/_components/ai-summary.tsx`: bloco entre o `<article>` do produto e a seção "Avaliações":
   - selo **"IA"** com ícone (ex.: `Sparkles`) + título "O que as pessoas estão dizendo";
   - texto do resumo; rodapé discreto "Gerado por IA a partir de N avaliações · atualizado há X";
   - sem resumo ainda: oculto quando houver 0 avaliações; com 1 avaliação, mensagem "O resumo aparece a partir de 2 avaliações".
9. Design pela skill frontend-design: destaque claro, mas distinto das avaliações humanas (que usam Newsreader). Evitar os clichês de IA (gradiente roxo, brilho). Usar a paleta Avalia (ex.: faixa Tinta com selo Selo) em light e dark.
10. Após publicar uma avaliação, o formulário já invalida a lista. O resumo atualiza no próximo carregamento da página, porque a geração roda depois da resposta. Ver ponto #3.

### Documentação
11. README: env `OPENAI_API_KEY`, migration, script de backfill. `docs/ARCHITECTURE.md` já cita Mastra.

## Arquivos
- **Novos:** migration, `src/mastra/index.ts`, `src/mastra/agents/review-summary-agent.ts`, `src/server/ai/summarize-reviews.ts`, `_components/ai-summary.tsx`, `scripts/backfill-ai-summaries.ts`
- **Alterados:** `next.config.ts`, `package.json`, `.env.example`, `src/server/db/products.ts`, `src/server/routers/feedbacks.ts`, `src/app/(platform)/products/[id]/page.tsx`, `README.md`

## Critérios de aceitação → verificação
| Critério | Como verificar |
|---|---|
| Resumo gerado a partir dos comentários | Produto com 2+ avaliações → bloco IA aparece com resumo coerente em pt-BR |
| Atualiza com novas avaliações | Nova avaliação → após recarregar, contagem "a partir de N avaliações" aumenta |
| Destaque como IA | Selo "IA" visível, posicionado entre produto e avaliações, light e dark |
| Falha da IA não quebra nada | Com `OPENAI_API_KEY` inválida, a avaliação é publicada normalmente e a página carrega |
| Público | Visitante deslogado vê o resumo |
| Qualidade | `bun run lint` e `bun run build` sem erros |

## Execução
Feature única e sequencial (back-end → front-end): executo diretamente, sem subagents.

## Fora do escopo
- Streaming do resumo, chat com o agente, resumo na home, Mastra Studio, observabilidade/memória da Mastra.

## Pontos para você confirmar
1. **Modelo:** "GPT-4 Mini" → `openai/gpt-4o-mini`. Ou prefere `openai/gpt-4.1-mini` (mais novo, preço parecido)?
2. **Mínimo de avaliações** para gerar o resumo: 2 está bom?
3. **Atualização em tempo real:** a geração leva alguns segundos e acontece depois de responder. Ok o resumo aparecer só no próximo carregamento, ou quer que a página atualize sozinha quando ele ficar pronto (polling curto)?
4. **Formato:** só o texto corrido, ou também listas "Pontos positivos / Pontos de atenção" (mesmo custo, pois é a mesma chamada)?
5. **Chave da OpenAI:** você precisa colocar `OPENAI_API_KEY=...` no `.env.local`. Eu não vejo nem envio essa chave para lugar nenhum além da OpenAI.

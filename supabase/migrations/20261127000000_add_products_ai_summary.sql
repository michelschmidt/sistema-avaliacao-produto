-- Resumo das avaliações gerado por IA (agente Mastra). Ver plans/ai-summary.md.
alter table public.products
  add column if not exists ai_summary                text,          -- resumo em pt-BR; null = ainda não gerado
  add column if not exists ai_summary_updated_at     timestamptz,
  add column if not exists ai_summary_feedback_count int;           -- quantas avaliações o resumo considerou

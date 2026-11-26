/**
 * Gera o resumo de IA dos produtos que já têm avaliações e ainda não têm resumo
 * (ou cujo resumo está desatualizado). Rodar uma vez:
 *   bun --conditions=react-server scripts/backfill-ai-summaries.ts
 * (`react-server` libera os imports `server-only` fora do Next.)
 */
import {
  MIN_FEEDBACKS_FOR_SUMMARY,
  summarizeReviews,
} from "@/server/ai/summarize-reviews";
import { listFeedbacksByProduct } from "@/server/db/feedbacks";
import {
  PRODUCT_COLUMNS,
  type ProductRow,
  toProduct,
  updateProductAiSummary,
} from "@/server/db/products";
import { getSupabaseAdmin } from "@/server/db/supabase";

const { data, error } = await getSupabaseAdmin()
  .from("products")
  .select(PRODUCT_COLUMNS)
  .returns<ProductRow[]>();
if (error) throw error;

let generated = 0;
for (const product of data.map(toProduct)) {
  const feedbacks = await listFeedbacksByProduct(product.id);
  if (feedbacks.length < MIN_FEEDBACKS_FOR_SUMMARY) continue;
  if ((product.aiSummaryFeedbackCount ?? 0) >= feedbacks.length) continue;

  try {
    const summary = await summarizeReviews(product.name, feedbacks);
    await updateProductAiSummary(product.id, summary, feedbacks.length);
    generated++;
    console.log(`✓ ${product.name} (${feedbacks.length} avaliações)`);
  } catch (err) {
    console.error(`✗ ${product.name}`, err);
  }
}

console.log(`Resumos gerados: ${generated}`);

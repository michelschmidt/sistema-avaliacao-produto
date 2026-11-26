import "server-only";

import { revalidateTag } from "next/cache";
import { listFeedbacksByProduct, productCacheTag } from "@/server/db/feedbacks";
import { findProductById, updateProductAiSummary } from "@/server/db/products";
import {
  MIN_FEEDBACKS_FOR_SUMMARY,
  summarizeReviews,
} from "./summarize-reviews";

/**
 * Regera o resumo de IA do produto a partir de todas as avaliações.
 * Nunca lança: a IA é complemento e não pode quebrar o fluxo de avaliação.
 */
export async function refreshProductAiSummary(
  productId: string,
): Promise<void> {
  try {
    const product = await findProductById(productId);
    if (!product) return;

    const feedbacks = await listFeedbacksByProduct(productId);
    if (feedbacks.length < MIN_FEEDBACKS_FOR_SUMMARY) return;

    const summary = await summarizeReviews(
      product.name,
      feedbacks.map(({ score, comment }) => ({ score, comment })),
    );

    const saved = await updateProductAiSummary(
      productId,
      summary,
      feedbacks.length,
    );
    if (saved) revalidateTag(productCacheTag(productId), { expire: 0 });
  } catch (error) {
    console.error("[ai.refreshProductAiSummary]", productId, error);
  }
}

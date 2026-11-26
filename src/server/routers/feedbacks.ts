import "server-only";

import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { revalidateTag } from "next/cache";
import { after } from "next/server";
import {
  createFeedbackSchema,
  listFeedbacksSchema,
} from "@/lib/validations/feedbacks";
import { refreshProductAiSummary } from "@/server/ai/refresh-product-summary";
import {
  type Feedback,
  insertFeedback,
  listFeedbacksByProduct,
  productCacheTag,
} from "@/server/db/feedbacks";
import { findProductById, type Product } from "@/server/db/products";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/trpc";

export type AiSummary = {
  text: string | null;
  updatedAt: string | null;
  feedbackCount: number | null;
};

export function toAiSummary(product: Product): AiSummary {
  return {
    text: product.aiSummary,
    updatedAt: product.aiSummaryUpdatedAt,
    feedbackCount: product.aiSummaryFeedbackCount,
  };
}

export const feedbacksRouter = createTRPCRouter({
  /** Público: resumo de IA atual do produto (usado pelo polling da página). */
  aiSummary: publicProcedure
    .input(listFeedbacksSchema)
    .query(async ({ input }) => {
      let product: Product | null;
      try {
        product = await findProductById(input.productId);
      } catch (error) {
        console.error("[feedbacks.aiSummary]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível carregar o resumo.",
        });
      }
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Produto não encontrado.",
        });
      }
      return toAiSummary(product);
    }),

  /** Público: avaliações do produto, mais recentes primeiro. */
  listByProduct: publicProcedure
    .input(listFeedbacksSchema)
    .query(async ({ input }) => {
      try {
        return await listFeedbacksByProduct(input.productId);
      } catch (error) {
        console.error("[feedbacks.listByProduct]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível carregar as avaliações.",
        });
      }
    }),

  /** Protegido: o autor vem sempre da sessão, nunca do corpo da requisição. */
  create: protectedProcedure
    .input(createFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      let product: Product | null;
      try {
        product = await findProductById(input.productId);
      } catch (error) {
        console.error("[feedbacks.create] findProductById", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível publicar sua avaliação. Tente novamente.",
        });
      }

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Produto não encontrado.",
        });
      }

      let feedback: Feedback;
      try {
        feedback = await insertFeedback({
          id: nanoid(),
          productId: product.id,
          createdBy: ctx.session.accountId,
          score: input.score,
          comment: input.comment,
        });
      } catch (error) {
        console.error("[feedbacks.create] insertFeedback", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível publicar sua avaliação. Tente novamente.",
        });
      }

      // Roda dentro de Route Handler (/api/trpc e /api/v1), onde `updateTag` não é
      // permitido. `expire: 0` descarta o cache na hora (read-your-own-writes).
      revalidateTag(productCacheTag(product.id), { expire: 0 });

      // Resumo de IA roda depois da resposta: quem avalia não espera o modelo.
      const productId = product.id;
      after(() => refreshProductAiSummary(productId));

      return feedback;
    }),
});

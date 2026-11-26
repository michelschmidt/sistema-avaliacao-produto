import { z } from "zod";

const SCORE_MESSAGE = "Escolha uma nota de 1 a 5";

export const COMMENT_MAX_LENGTH = 1000;

/**
 * Campos que a pessoa preenche no formulário. Compartilhado entre o
 * React Hook Form e a procedure tRPC (`feedbacks.create`).
 */
export const feedbackFormSchema = z.object({
  score: z
    .number({ error: SCORE_MESSAGE })
    .int(SCORE_MESSAGE)
    .min(1, SCORE_MESSAGE)
    .max(5, SCORE_MESSAGE),
  comment: z
    .string({ error: "Escreva um comentário" })
    .trim()
    .min(1, "Escreva um comentário")
    .max(COMMENT_MAX_LENGTH, `Use no máximo ${COMMENT_MAX_LENGTH} caracteres`),
});

/** Entrada da API: o produto vem da rota; o autor vem sempre da sessão. */
export const createFeedbackSchema = feedbackFormSchema.extend({
  productId: z
    .string({ error: "Informe o produto" })
    .trim()
    .min(1, "Informe o produto"),
});

export const listFeedbacksSchema = z.object({
  productId: z.string().trim().min(1),
});

export type FeedbackFormInput = z.input<typeof feedbackFormSchema>;
export type CreateFeedbackInput = z.input<typeof createFeedbackSchema>;

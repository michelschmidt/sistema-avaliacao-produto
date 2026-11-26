import "server-only";

import { z } from "zod";
import { mastra } from "@/mastra";

/** Abaixo disso o resumo só repetiria o comentário. */
export const MIN_FEEDBACKS_FOR_SUMMARY = 2;

/** Limites de custo: avaliações mais recentes primeiro, até atingir um dos dois. */
const MAX_FEEDBACKS = 100;
const MAX_CHARS = 20_000;

const summarySchema = z.object({
  summary: z
    .string()
    .describe("Resumo geral em pt-BR, 2 a 4 frases, sem markdown"),
});

export type ReviewForSummary = { score: number; comment: string };

/** Gera o resumo. Recebe só nota + comentário (nenhum dado pessoal vai ao provedor). */
export async function summarizeReviews(
  productName: string,
  reviews: ReviewForSummary[],
): Promise<string> {
  const lines: string[] = [];
  let chars = 0;
  for (const review of reviews.slice(0, MAX_FEEDBACKS)) {
    const comment = review.comment.replace(/\s+/g, " ").trim();
    const line = `- Nota ${review.score}/5: ${comment}`;
    if (chars + line.length > MAX_CHARS) break;
    lines.push(line);
    chars += line.length;
  }

  const prompt = `Produto: ${productName}
Total de avaliações consideradas: ${lines.length}

<avaliacoes>
${lines.join("\n")}
</avaliacoes>`;

  const agent = mastra.getAgentById("review-summary");
  const response = await agent.generate(prompt, {
    structuredOutput: { schema: summarySchema },
  });

  const summary = response.object?.summary?.trim();
  if (!summary) throw new Error("Agente não retornou um resumo");
  return summary;
}

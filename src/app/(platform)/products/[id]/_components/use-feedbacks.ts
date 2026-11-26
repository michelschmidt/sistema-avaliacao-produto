"use client";

import { useQuery } from "@tanstack/react-query";
import type { Feedback } from "@/server/db/feedbacks";
import { useTRPC } from "@/trpc/client";

/**
 * Avaliações do produto. O servidor entrega a primeira leitura (cacheada com a
 * página); depois de publicar, o formulário invalida esta query e a lista e a
 * média se atualizam juntas.
 */
export function useFeedbacks(productId: string, initialData: Feedback[]) {
  const trpc = useTRPC();
  return useQuery(
    trpc.feedbacks.listByProduct.queryOptions({ productId }, { initialData }),
  );
}

"use client";

import type { Feedback } from "@/server/db/feedbacks";
import { formatScore, ScoreStars } from "./stars";
import { useFeedbacks } from "./use-feedbacks";

function averageOf(feedbacks: Feedback[]) {
  if (feedbacks.length === 0) return null;
  const sum = feedbacks.reduce((total, feedback) => total + feedback.score, 0);
  return Math.round((sum / feedbacks.length) * 10) / 10;
}

/**
 * Média e contagem. Calculadas da mesma lista exibida na página para que a
 * nova avaliação mude os dois números na hora; `products.score` guarda o mesmo
 * valor arredondado para a home.
 */
export function ProductScore({
  productId,
  initialFeedbacks,
}: {
  productId: string;
  initialFeedbacks: Feedback[];
}) {
  const { data: feedbacks = initialFeedbacks } = useFeedbacks(
    productId,
    initialFeedbacks,
  );
  const average = averageOf(feedbacks);
  const count = feedbacks.length;

  if (average === null) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <ScoreStars
          value={0}
          label="Ainda sem avaliações"
          className="text-3xl"
        />
        <p className="text-base text-muted-foreground">Ainda sem avaliações</p>
      </div>
    );
  }

  const countLabel = count === 1 ? "1 avaliação" : `${count} avaliações`;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <ScoreStars
        value={average}
        label={`Média ${formatScore(average)} de 5`}
        className="text-3xl sm:text-4xl"
      />
      <p className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums tracking-[-0.01em]">
          {formatScore(average)}
        </span>
        <span className="text-base text-muted-foreground">
          de 5, em {countLabel}
        </span>
      </p>
    </div>
  );
}

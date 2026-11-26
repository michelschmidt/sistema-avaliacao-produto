"use client";

import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Feedback } from "@/server/db/feedbacks";
import { SCORE_LABELS } from "./star-input";
import { ScoreStars } from "./stars";
import { useFeedbacks } from "./use-feedbacks";

function FeedbackItem({ feedback }: { feedback: Feedback }) {
  const createdAt = new Date(feedback.createdAt);
  return (
    <li className="py-8 first:pt-0 last:pb-0">
      <figure className="flex flex-col gap-4">
        <ScoreStars
          value={feedback.score}
          label={`Nota ${feedback.score} de 5: ${SCORE_LABELS[feedback.score - 1] ?? ""}`}
          className="text-lg"
        />
        <blockquote className="max-w-[60ch] font-serif text-xl leading-[1.55] break-words whitespace-pre-line text-foreground">
          {feedback.comment}
        </blockquote>
        <figcaption className="flex items-center gap-3">
          {/* biome-ignore lint/performance/noImgElement: SVG externo do DiceBear; evita dangerouslyAllowSVG no next/image */}
          <img
            src={feedback.author.avatarUrl}
            alt=""
            width={36}
            height={36}
            loading="lazy"
            className="size-9 rounded-full bg-muted"
          />
          <span className="flex flex-col">
            <span className="text-sm font-semibold">
              {feedback.author.name}
            </span>
            <time
              dateTime={feedback.createdAt}
              title={format(createdAt, "d 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
              suppressHydrationWarning
              className="text-sm text-muted-foreground"
            >
              {formatDistanceToNow(createdAt, {
                addSuffix: true,
                locale: ptBR,
              })}
            </time>
          </span>
        </figcaption>
      </figure>
    </li>
  );
}

export function FeedbackList({
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

  if (feedbacks.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-3xl border border-dashed border-border px-6 py-10 sm:px-8">
        <ScoreStars value={0} label="Nenhuma avaliação" className="text-2xl" />
        <p className="text-xl font-semibold tracking-[-0.01em]">
          Seja a primeira pessoa a avaliar
        </p>
        <p className="max-w-[44ch] text-base leading-relaxed text-muted-foreground">
          Ninguém avaliou este produto ainda. Sua nota e seu comentário vão
          aparecer aqui.
        </p>
      </div>
    );
  }

  return (
    <ol className="flex flex-col divide-y divide-border">
      {feedbacks.map((feedback) => (
        <FeedbackItem key={feedback.id} feedback={feedback} />
      ))}
    </ol>
  );
}

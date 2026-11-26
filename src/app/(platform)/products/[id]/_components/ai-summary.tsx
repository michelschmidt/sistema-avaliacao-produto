"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { Feedback } from "@/server/db/feedbacks";
import type { AiSummary as AiSummaryData } from "@/server/routers/feedbacks";
import { useTRPC } from "@/trpc/client";
import { useFeedbacks } from "./use-feedbacks";

/** Mesmo mínimo do servidor (`MIN_FEEDBACKS_FOR_SUMMARY`). */
const MIN_FEEDBACKS = 2;
const POLL_INTERVAL_MS = 2500;
/** Tempo máximo esperando a IA antes de desistir do polling. */
const POLL_WINDOW_MS = 45_000;

/**
 * Resumo das avaliações gerado por IA. O servidor gera o texto depois que uma
 * avaliação é publicada; enquanto o resumo estiver atrás da lista, a página
 * consulta de novo a cada 2,5 s (por até 45 s) e troca o texto sozinha.
 */
export function AiSummary({
  productId,
  initialFeedbacks,
  initialSummary,
}: {
  productId: string;
  initialFeedbacks: Feedback[];
  initialSummary: AiSummaryData;
}) {
  const trpc = useTRPC();
  const { data: feedbacks = initialFeedbacks } = useFeedbacks(
    productId,
    initialFeedbacks,
  );
  const count = feedbacks.length;

  // Reabre a janela de espera sempre que a lista cresce (nova avaliação).
  const [deadline, setDeadline] = useState(() => Date.now() + POLL_WINDOW_MS);
  useEffect(() => {
    if (count > 0) setDeadline(Date.now() + POLL_WINDOW_MS);
  }, [count]);

  const isBehind = (summary: AiSummaryData | undefined) =>
    count >= MIN_FEEDBACKS && (summary?.feedbackCount ?? 0) < count;

  const { data: summary = initialSummary } = useQuery(
    trpc.feedbacks.aiSummary.queryOptions(
      { productId },
      {
        initialData: initialSummary,
        refetchInterval: (query) =>
          isBehind(query.state.data) && Date.now() < deadline
            ? POLL_INTERVAL_MS
            : false,
      },
    ),
  );

  if (count === 0) return null;

  const waiting = isBehind(summary) && Date.now() < deadline;

  return (
    <section
      aria-labelledby="ai-summary-title"
      className="rounded-3xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
          <Sparkles aria-hidden className="size-3.5" />
          IA
        </span>
        <h2
          id="ai-summary-title"
          className="text-xl font-semibold tracking-[-0.01em]"
        >
          O que as pessoas estão dizendo
        </h2>
      </div>

      <div aria-live="polite" className="mt-4 flex flex-col gap-4">
        {summary.text ? (
          <p className="max-w-[70ch] text-lg leading-relaxed text-card-foreground">
            {summary.text}
          </p>
        ) : count < MIN_FEEDBACKS ? (
          <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground">
            O resumo aparece a partir de {MIN_FEEDBACKS} avaliações. Falta só
            mais uma.
          </p>
        ) : !waiting ? (
          <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground">
            O resumo ainda não está disponível. Ele será atualizado na próxima
            avaliação.
          </p>
        ) : null}

        {waiting && (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span
              aria-hidden
              className="size-2 animate-pulse rounded-full bg-primary motion-reduce:animate-none"
            />
            {summary.text
              ? "Atualizando o resumo com a avaliação mais recente…"
              : "Gerando o resumo das avaliações…"}
          </p>
        )}

        {summary.text && summary.feedbackCount && !waiting && (
          <SummaryMeta
            feedbackCount={summary.feedbackCount}
            updatedAt={summary.updatedAt}
          />
        )}
      </div>
    </section>
  );
}

function SummaryMeta({
  feedbackCount,
  updatedAt,
}: {
  feedbackCount: number;
  updatedAt: string | null;
}) {
  const label =
    feedbackCount === 1 ? "1 avaliação" : `${feedbackCount} avaliações`;
  return (
    <p className="text-sm text-muted-foreground">
      Gerado por IA a partir de {label}
      {updatedAt && (
        <>
          {", atualizado "}
          <time dateTime={updatedAt} suppressHydrationWarning>
            {formatDistanceToNow(new Date(updatedAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </time>
        </>
      )}
      . Pode conter imprecisões.
    </p>
  );
}

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const TOTAL_STARS = 5;

type StarsProps = {
  filled: number;
  label: string;
  className?: string;
};

/** Linha de 5 estrelas. Cada estrela acesa faz um pequeno "pop" ao acender. */
export function Stars({ filled, label, className }: StarsProps) {
  return (
    <div role="img" aria-label={label} className={cn("flex gap-1", className)}>
      {Array.from({ length: TOTAL_STARS }, (_, index) => {
        const isOn = index < filled;
        return (
          <Star
            // biome-ignore lint/suspicious/noArrayIndexKey: posição fixa da estrela
            key={index}
            aria-hidden
            strokeWidth={1.5}
            className={cn(
              "size-[1em] transition-colors duration-200",
              isOn
                ? "animate-star-pop fill-selo text-selo motion-reduce:animate-none"
                : "fill-transparent text-panel-foreground/30",
            )}
          />
        );
      })}
    </div>
  );
}

type ReviewPanelProps = {
  filled: number;
  starsLabel: string;
  caption?: string;
  quote: string;
  signature: string;
  signatureNote: string;
  className?: string;
};

/** Prévia de uma avaliação: o elemento de destaque das telas de conta. */
export function ReviewPanel({
  filled,
  starsLabel,
  caption,
  quote,
  signature,
  signatureNote,
  className,
}: ReviewPanelProps) {
  return (
    <section
      aria-label="Prévia da sua avaliação"
      className={cn(
        "flex flex-col justify-center rounded-3xl border border-panel-border bg-panel p-10 text-panel-foreground xl:p-16",
        className,
      )}
    >
      <figure className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          {caption && <p className="text-sm text-panel-muted">{caption}</p>}
          <Stars filled={filled} label={starsLabel} className="text-4xl" />
        </div>
        <blockquote className="max-w-[22ch] font-serif text-4xl leading-[1.15] font-normal tracking-[-0.01em] text-balance xl:text-5xl">
          “{quote}”
        </blockquote>
        <figcaption className="flex flex-col gap-0.5">
          <span className="text-lg font-semibold">— {signature}</span>
          <span className="text-sm text-panel-muted">{signatureNote}</span>
        </figcaption>
      </figure>
    </section>
  );
}

type ReviewStripProps = {
  filled: number;
  starsLabel: string;
  signature: string;
  className?: string;
};

/** Versão compacta da prévia para telas pequenas. */
export function ReviewStrip({
  filled,
  starsLabel,
  signature,
  className,
}: ReviewStripProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-2xl bg-panel px-4 py-3 text-panel-foreground",
        className,
      )}
    >
      <Stars filled={filled} label={starsLabel} className="text-xl" />
      <span className="truncate font-serif text-lg">— {signature}</span>
    </div>
  );
}

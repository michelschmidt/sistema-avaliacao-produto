import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const TOTAL_STARS = 5;

type ScoreStarsProps = {
  /** Nota de 0 a 5; aceita frações (ex.: 4.3 acende 30% da quinta estrela). */
  value: number;
  label: string;
  className?: string;
  /** Cor das estrelas apagadas. */
  offClassName?: string;
};

/** Linha de 5 estrelas Selo, com preenchimento parcial para médias. */
export function ScoreStars({
  value,
  label,
  className,
  offClassName = "text-foreground/25",
}: ScoreStarsProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("flex gap-[0.15em]", className)}
    >
      {Array.from({ length: TOTAL_STARS }, (_, index) => {
        const fill = Math.min(Math.max(value - index, 0), 1);
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: posição fixa da estrela
            key={index}
            aria-hidden
            className="relative inline-flex size-[1em] shrink-0"
          >
            <Star
              strokeWidth={1.5}
              className={cn("size-full fill-transparent", offClassName)}
            />
            {fill > 0 && (
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  strokeWidth={1.5}
                  className="size-[1em] max-w-none fill-selo text-selo"
                />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/** "4,3" no formato brasileiro. */
export function formatScore(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

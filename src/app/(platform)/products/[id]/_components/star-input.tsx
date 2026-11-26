"use client";

import { Star } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export const SCORE_LABELS = [
  "Muito ruim",
  "Ruim",
  "Regular",
  "Bom",
  "Excelente",
] as const;

type StarInputProps = {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  name: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
};

/**
 * Seletor de nota acessível: um grupo de 5 radios nativos (Tab entra no grupo,
 * setas trocam a nota). As estrelas são só a camada visual de cada radio.
 */
export function StarInput({
  value,
  onChange,
  onBlur,
  name,
  disabled,
  invalid,
  describedBy,
}: StarInputProps) {
  const id = useId();
  const [hovered, setHovered] = useState(0);
  const preview = hovered || value;

  return (
    <fieldset
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      disabled={disabled}
      className="flex flex-col gap-3"
    >
      <legend className="mb-3 text-sm font-medium">Sua nota</legend>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div
          className="flex gap-1"
          onPointerLeave={() => setHovered(0)}
          role="presentation"
        >
          {SCORE_LABELS.map((label, index) => {
            const score = index + 1;
            const inputId = `${id}-${score}`;
            const isOn = score <= preview;
            // A estrela "estala" só quando a nota é escolhida (não no hover):
            // a key muda com o valor e remonta o ícone, reiniciando a animação.
            const popKey = score <= value ? `on-${value}` : "off";
            return (
              <label
                key={score}
                htmlFor={inputId}
                onPointerEnter={() => setHovered(score)}
                className="group/star relative cursor-pointer rounded-md p-0.5 has-[:disabled]:cursor-not-allowed has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-panel-foreground/60"
              >
                <input
                  id={inputId}
                  type="radio"
                  name={name}
                  value={score}
                  checked={value === score}
                  onChange={() => onChange(score)}
                  onBlur={onBlur}
                  className="peer sr-only"
                />
                <span className="sr-only">
                  {score} {score === 1 ? "estrela" : "estrelas"}: {label}
                </span>
                <Star
                  key={popKey}
                  aria-hidden
                  strokeWidth={1.5}
                  className={cn(
                    "size-9 transition-colors duration-150 sm:size-10",
                    isOn
                      ? "fill-selo text-selo"
                      : "fill-transparent text-panel-foreground/35 group-hover/star:text-panel-foreground/60",
                    score <= value &&
                      "animate-star-pop motion-reduce:animate-none",
                  )}
                />
              </label>
            );
          })}
        </div>
        <p
          aria-hidden
          className={cn(
            "min-w-[9ch] text-base font-medium",
            preview ? "text-panel-foreground" : "text-panel-muted",
          )}
        >
          {preview ? SCORE_LABELS[preview - 1] : "Escolha de 1 a 5"}
        </p>
      </div>
    </fieldset>
  );
}

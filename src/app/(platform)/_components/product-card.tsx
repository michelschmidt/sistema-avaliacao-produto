"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export type ProductCardData = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  score: number | null;
};

const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Item da vitrine: sem caixa nem sombra. A imagem é a moldura, o nome é o link
 * (esticado sobre o item inteiro) e a nota aparece como um selo carimbado.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <article className="group/product relative flex flex-col gap-4 rounded-2xl outline-none has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50 has-[a:focus-visible]:ring-offset-4 has-[a:focus-visible]:ring-offset-background">
      <div className="relative">
        <ProductImage name={product.name} imageUrl={product.imageUrl} />
        {product.score !== null && <ScoreSeal score={product.score} />}
      </div>

      <div className="flex flex-col gap-1.5 px-1">
        <h2 className="text-lg leading-snug font-semibold tracking-tight text-balance">
          <Link
            href={`/products/${product.id}`}
            className="underline-offset-4 outline-none decoration-2 decoration-selo after:absolute after:inset-0 after:rounded-2xl group-hover/product:underline focus-visible:underline"
          >
            {product.name}
          </Link>
        </h2>
        {product.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        ) : null}
        {product.score === null ? (
          <p className="text-sm text-muted-foreground">
            Ainda sem avaliações. Conte como foi a sua.
          </p>
        ) : null}
      </div>
    </article>
  );
}

function ProductImage({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = imageUrl && !failed;

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted">
      {showImage ? (
        // biome-ignore lint/performance/noImgElement: URLs externas arbitrárias não cabem em remotePatterns do next/image.
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full bg-white object-contain p-4"
        />
      ) : (
        <ImageFallback name={name} />
      )}
    </div>
  );
}

/** Sem imagem (ou link quebrado): a inicial do produto, grande, sobre o Gesso. */
function ImageFallback({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toLocaleUpperCase("pt-BR") || "?";

  return (
    <div
      aria-hidden
      className="flex size-full items-end justify-between bg-secondary p-5"
    >
      <span className="text-8xl leading-none font-bold tracking-tighter text-foreground/15">
        {initial}
      </span>
      <Star className="size-6 text-foreground/15" />
    </div>
  );
}

/** Selo carimbado no canto da imagem com a média das avaliações. */
function ScoreSeal({ score }: { score: number }) {
  const formatted = scoreFormatter.format(score);

  return (
    <div className="absolute -top-3 -right-2 flex size-16 -rotate-6 flex-col items-center justify-center rounded-full bg-selo text-[#1f2a4d] ring-4 ring-background">
      <Star aria-hidden className="size-3.5 fill-current" />
      <span className="text-lg leading-none font-bold tracking-tight tabular-nums">
        <span className="sr-only">Nota média </span>
        {formatted}
      </span>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <div className="aspect-[4/3] animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
      <div className="flex flex-col gap-2 px-1">
        <div className="h-5 w-3/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-full animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>
    </div>
  );
}

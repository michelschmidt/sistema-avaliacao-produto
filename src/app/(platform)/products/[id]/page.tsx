import { ExternalLink, ImageOff } from "lucide-react";
import type { Metadata } from "next";
import { cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listFeedbacksByProduct, productCacheTag } from "@/server/db/feedbacks";
import { findProductById } from "@/server/db/products";
import { toAiSummary } from "@/server/routers/feedbacks";
import { AiSummary } from "./_components/ai-summary";
import {
  FeedbackGate,
  FeedbackGateSkeleton,
} from "./_components/feedback-gate";
import { FeedbackList } from "./_components/feedback-list";
import { ProductScore } from "./_components/product-score";

type Params = Promise<{ id: string }>;

/**
 * Produto + avaliações, cacheados juntos na tag `product:{id}`.
 * `feedbacks.create` invalida a tag a cada nova avaliação.
 */
async function getProductPage(id: string) {
  "use cache";
  cacheTag(productCacheTag(id));

  const product = await findProductById(id);
  if (!product) return null;

  const feedbacks = await listFeedbacksByProduct(id);
  return { product, feedbacks };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getProductPage(id);
  if (!data) return { title: "Produto não encontrado | Avalia" };
  return {
    title: `${data.product.name} | Avalia`,
    description: data.product.description ?? undefined,
  };
}

/** O `id` só é conhecido na requisição: o conteúdo entra em <Suspense> (cacheComponents). */
export default function ProductPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: Params }) {
  const { id } = await params;
  const data = await getProductPage(id);
  if (!data) notFound();

  const { product, feedbacks } = data;

  return (
    <div className="flex flex-col gap-14 lg:gap-20">
      <article className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-6">
          {product.imageUrl ? (
            // biome-ignore lint/performance/noImgElement: imagem externa de qualquer domínio; next/image exigiria remotePatterns
            <img
              src={product.imageUrl}
              alt={product.name}
              className="aspect-[4/3] w-full rounded-3xl border border-border bg-white object-contain p-6"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl bg-muted text-muted-foreground">
              <ImageOff aria-hidden className="size-10" strokeWidth={1.5} />
              <span className="sr-only">Produto sem imagem</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:col-span-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-[2rem] leading-[1.1] font-semibold tracking-[-0.025em] text-balance sm:text-[2.75rem]">
              {product.name}
            </h1>
            {product.description && (
              <p className="max-w-[60ch] text-lg leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            )}
          </div>

          <ProductScore productId={product.id} initialFeedbacks={feedbacks} />

          <a
            href={product.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 self-start rounded-[10px] px-4 text-base font-semibold",
            )}
          >
            Ver produto
            <ExternalLink aria-hidden />
            <span className="sr-only">(abre em nova aba)</span>
          </a>
        </div>
      </article>

      <AiSummary
        productId={product.id}
        initialFeedbacks={feedbacks}
        initialSummary={toAiSummary(product)}
      />

      <section
        aria-labelledby="reviews-title"
        className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14"
      >
        <div className="flex flex-col gap-8 lg:col-span-7">
          <h2
            id="reviews-title"
            className="text-2xl font-semibold tracking-[-0.01em]"
          >
            Avaliações
          </h2>
          <FeedbackList productId={product.id} initialFeedbacks={feedbacks} />
        </div>

        <aside
          aria-label="Avaliar este produto"
          className="rounded-3xl bg-panel p-6 text-panel-foreground sm:p-8 lg:sticky lg:top-8 lg:col-span-5"
        >
          <Suspense fallback={<FeedbackGateSkeleton />}>
            <FeedbackGate productId={product.id} productName={product.name} />
          </Suspense>
        </aside>
      </section>
    </div>
  );
}

function ProductPageSkeleton() {
  const pulse = "animate-pulse bg-muted motion-reduce:animate-none";
  return (
    <div
      aria-hidden
      className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14"
    >
      <div
        className={cn("aspect-[4/3] w-full rounded-3xl lg:col-span-6", pulse)}
      />
      <div className="flex flex-col gap-5 lg:col-span-6">
        <div className={cn("h-11 w-3/4 rounded-lg", pulse)} />
        <div className={cn("h-5 w-full rounded-md", pulse)} />
        <div className={cn("h-5 w-2/3 rounded-md", pulse)} />
        <div className={cn("h-9 w-56 rounded-lg", pulse)} />
      </div>
    </div>
  );
}

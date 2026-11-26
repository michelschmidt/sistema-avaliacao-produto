"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { CircleAlert, PackageOpen } from "lucide-react";
import { useEffect, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { ProductCard, ProductCardSkeleton } from "./product-card";

const PAGE_SIZE = 12;
const GRID = "grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3";

export function ProductGrid() {
  const trpc = useTRPC();
  const query = useInfiniteQuery(
    trpc.products.list.infiniteQueryOptions(
      { limit: PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );
  // Lidos fora do destructuring para o TS não estreitar a união de estados.
  const { fetchNextPage, refetch } = query;
  const { data, status, isRefetching, hasNextPage, isFetchingNextPage } = query;
  const isFetchNextPageError = query.isFetchNextPageError;

  const sentinelRef = useRef<HTMLDivElement>(null);
  const canAutoLoad =
    hasNextPage && !isFetchingNextPage && !isFetchNextPageError;

  // Carrega a próxima página um pouco antes de a pessoa chegar ao fim da lista.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !canAutoLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchNextPage();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canAutoLoad, fetchNextPage]);

  if (status === "pending") {
    return (
      <div className={GRID} aria-busy="true">
        <output className="sr-only">Carregando produtos</output>
        {Array.from({ length: 6 }, (_, index) => (
          <ProductCardSkeleton key={`skeleton-${index.toString()}`} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <Alert variant="destructive" className="max-w-xl px-4 py-3">
        <CircleAlert />
        <AlertTitle>Não foi possível carregar os produtos</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <p>Verifique sua conexão e tente de novo.</p>
          <Button
            variant="outline"
            onClick={() => void refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? "Tentando…" : "Tentar novamente"}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const products = data.pages.flatMap((page) => page.items);

  if (products.length === 0) {
    return (
      <div className="flex max-w-md flex-col items-start gap-3 rounded-2xl border border-dashed border-input p-8">
        <PackageOpen aria-hidden className="size-8 text-muted-foreground" />
        <h2 className="text-lg font-semibold tracking-tight">
          Nenhum produto por aqui ainda
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Assim que os primeiros produtos forem cadastrados, eles aparecem nesta
          vitrine para você avaliar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <ul className={GRID} aria-busy={isFetchingNextPage}>
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
        {isFetchingNextPage &&
          Array.from({ length: 3 }, (_, index) => (
            <li key={`next-skeleton-${index.toString()}`} aria-hidden>
              <ProductCardSkeleton />
            </li>
          ))}
      </ul>

      <div ref={sentinelRef} className="flex min-h-10 justify-center">
        <output className="sr-only">
          {isFetchingNextPage ? "Carregando mais produtos" : ""}
        </output>
        {isFetchNextPageError ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-destructive">
              Não foi possível carregar mais produtos.
            </p>
            <Button variant="outline" onClick={() => void fetchNextPage()}>
              Tentar novamente
            </Button>
          </div>
        ) : hasNextPage ? (
          <Button
            variant="ghost"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-muted-foreground"
          >
            {isFetchingNextPage ? "Carregando…" : "Carregar mais produtos"}
          </Button>
        ) : (
          <p className="flex items-center gap-3 text-sm text-muted-foreground">
            <span aria-hidden className="h-px w-8 bg-border" />
            {products.length === 1
              ? "Esse é o único produto por enquanto"
              : `Você viu todos os ${products.length} produtos`}
            <span aria-hidden className="h-px w-8 bg-border" />
          </p>
        )}
      </div>
    </div>
  );
}

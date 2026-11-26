import { ProductGrid } from "./_components/product-grid";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10 lg:gap-14">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl">
          Produtos para avaliar
        </h1>
        <p className="max-w-[60ch] text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
          Veja o que as pessoas estão achando de cada produto e conte como foi a
          sua experiência.
        </p>
      </header>
      <ProductGrid />
    </div>
  );
}

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ProductNotFound() {
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-4 py-16">
      <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.02em]">
        Produto não encontrado
      </h1>
      <p className="max-w-[48ch] text-lg leading-relaxed text-muted-foreground">
        O link pode estar incompleto ou o produto foi removido. Veja os produtos
        disponíveis na página inicial.
      </p>
      <Link
        href="/"
        className={cn(
          buttonVariants(),
          "mt-2 h-11 rounded-[10px] px-5 text-base font-semibold",
        )}
      >
        Ver produtos
      </Link>
    </div>
  );
}

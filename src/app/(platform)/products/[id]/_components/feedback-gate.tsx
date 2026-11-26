import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSession } from "@/server/auth/session";
import { FeedbackForm } from "./feedback-form";
import { ScoreStars } from "./stars";

type FeedbackGateProps = {
  productId: string;
  productName: string;
};

/**
 * Lê a sessão (cookie), então precisa ficar dentro de <Suspense> com cacheComponents.
 * Sem sessão: convite para entrar. Com sessão: formulário de avaliação.
 */
export async function FeedbackGate({
  productId,
  productName,
}: FeedbackGateProps) {
  const session = await getSession();

  if (session) {
    return <FeedbackForm productId={productId} productName={productName} />;
  }

  const next = encodeURIComponent(`/products/${productId}`);

  return (
    <div className="flex flex-col gap-6">
      <ScoreStars
        value={0}
        label="Avaliação ainda não preenchida"
        className="text-4xl"
        offClassName="text-panel-foreground/35"
      />
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-[-0.01em]">
          Entre para avaliar
        </h2>
        <p className="max-w-[40ch] text-base leading-relaxed text-panel-muted">
          Qualquer pessoa pode ler as avaliações. Para dar sua nota a{" "}
          {productName}, entre na sua conta ou crie uma em menos de um minuto.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
        <Link
          href={`/auth/sign-in?next=${next}`}
          className={cn(
            buttonVariants(),
            "h-11 flex-1 rounded-[10px] bg-panel-foreground text-base font-semibold text-panel hover:bg-panel-foreground/90 focus-visible:ring-panel-foreground/50",
          )}
        >
          Entrar
        </Link>
        <Link
          href={`/auth/sign-up?next=${next}`}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-11 flex-1 rounded-[10px] border-panel-foreground/30 bg-transparent text-base font-semibold text-panel-foreground hover:bg-panel-foreground/10 hover:text-panel-foreground focus-visible:ring-panel-foreground/50 dark:border-panel-foreground/30 dark:bg-transparent dark:hover:bg-panel-foreground/10",
          )}
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}

export function FeedbackGateSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="h-10 w-52 animate-pulse rounded-lg bg-panel-foreground/10 motion-reduce:animate-none" />
      <div className="h-7 w-40 animate-pulse rounded-lg bg-panel-foreground/10 motion-reduce:animate-none" />
      <div className="h-24 w-full animate-pulse rounded-[10px] bg-panel-foreground/10 motion-reduce:animate-none" />
      <div className="h-11 w-full animate-pulse rounded-[10px] bg-panel-foreground/10 motion-reduce:animate-none" />
    </div>
  );
}

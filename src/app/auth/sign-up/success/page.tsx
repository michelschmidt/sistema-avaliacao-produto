import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AuthSwitchLink } from "../../_components/auth-switch-link";
import { ReviewPanel, ReviewStrip } from "../../_components/review-panel";

export const metadata: Metadata = {
  title: "Conta criada · Avalia",
};

export default function SignUpSuccessPage() {
  return (
    <div className="grid w-full items-stretch gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="flex flex-col justify-center gap-8 lg:col-span-5">
        <ReviewStrip
          filled={5}
          starsLabel="Cadastro completo"
          signature="Você"
          className="lg:hidden"
        />

        <div className="flex flex-col gap-3">
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] sm:text-[2.5rem]">
            Conta criada
          </h1>
          <p className="max-w-[44ch] text-base leading-relaxed text-muted-foreground">
            Agora é só entrar com o email e a senha que você acabou de criar
            para publicar suas avaliações.
          </p>
        </div>

        <AuthSwitchLink
          href="/auth/sign-in"
          className={cn(
            buttonVariants(),
            "h-11 self-start rounded-[10px] px-6 text-base font-semibold",
          )}
        >
          Entrar
        </AuthSwitchLink>
      </div>

      <ReviewPanel
        filled={5}
        starsLabel="Cadastro completo"
        quote="Tudo certo para a sua primeira avaliação."
        signature="Você"
        signatureNote="Membro da Avalia"
        className="hidden min-h-[34rem] lg:col-span-7 lg:flex"
      />
    </div>
  );
}

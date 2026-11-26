"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { safeNextPath } from "@/lib/validations/sign-in";

type AuthSwitchLinkProps = {
  href: "/auth/sign-in" | "/auth/sign-up";
  className?: string;
  children: ReactNode;
};

/** Repassa o `?next=` atual (se for um caminho interno) para a outra tela de conta. */
function LinkWithNext({ href, className, children }: AuthSwitchLinkProps) {
  const next = useSearchParams().get("next");
  const safe = safeNextPath(next);
  const target =
    next && safe !== "/" ? `${href}?next=${encodeURIComponent(safe)}` : href;

  return (
    <Link href={target} className={className}>
      {children}
    </Link>
  );
}

/**
 * Link "Entrar" ↔ "Criar conta". Ler a query string é dado de requisição, então fica
 * atrás de Suspense; o fallback é o mesmo link sem `next`, sem salto de layout.
 */
export function AuthSwitchLink(props: AuthSwitchLinkProps) {
  return (
    <Suspense
      fallback={
        <Link href={props.href} className={props.className}>
          {props.children}
        </Link>
      }
    >
      <LinkWithNext {...props} />
    </Suspense>
  );
}

export const authSwitchLinkClass =
  "font-semibold text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors outline-none hover:decoration-foreground focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50";

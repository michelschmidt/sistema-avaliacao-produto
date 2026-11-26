import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSession } from "@/server/auth/session";
import { findPublicAccountById } from "@/server/db/accounts";
import { HeaderAccountMenu } from "./header-account-menu";

/**
 * Estado de login no cabeçalho. Lê o cookie de sessão, então precisa ficar dentro
 * de `<Suspense>` no layout (cacheComponents).
 */
export async function HeaderUser() {
  const session = await getSession();
  const account = session
    ? await findPublicAccountById(session.accountId).catch((error) => {
        console.error("[HeaderUser]", error);
        return null;
      })
    : null;

  if (!account?.active) {
    return (
      <Link
        href="/auth/sign-in"
        className={cn(
          buttonVariants(),
          "h-10 rounded-[10px] px-5 text-[0.9375rem] font-semibold",
        )}
      >
        Entrar
      </Link>
    );
  }

  const name = `${account.firstName} ${account.lastName}`.trim();
  const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=1f2a4d&textColor=f3f4ef&fontWeight=600`;

  return (
    <HeaderAccountMenu
      name={name}
      email={account.email}
      avatarUrl={avatarUrl}
    />
  );
}

/** Mesmo formato do bloco logado (avatar + duas linhas) para não haver salto. */
export function HeaderUserSkeleton() {
  return (
    <div
      aria-hidden
      className="flex h-10 items-center gap-3 motion-safe:animate-pulse"
    >
      <div className="hidden flex-col items-end gap-1.5 sm:flex">
        <div className="h-3 w-24 rounded-full bg-muted" />
        <div className="h-2.5 w-32 rounded-full bg-muted" />
      </div>
      <div className="size-10 rounded-full bg-muted" />
    </div>
  );
}

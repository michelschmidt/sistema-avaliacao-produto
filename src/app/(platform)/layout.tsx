import { Star } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { HeaderUser, HeaderUserSkeleton } from "./_components/header-user";

/** Layout base da plataforma. A sessão é lida só dentro do Suspense (cacheComponents). */
export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 pt-6 sm:px-8 sm:pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <Star aria-hidden className="size-5 fill-selo text-selo" />
          Avalia
        </Link>
        <Suspense fallback={<HeaderUserSkeleton />}>
          <HeaderUser />
        </Suspense>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-8 sm:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}

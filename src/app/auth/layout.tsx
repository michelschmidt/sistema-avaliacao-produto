import { Star } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/auth">) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto w-full max-w-6xl px-5 pt-6 sm:px-8 sm:pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md text-lg font-bold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Star aria-hidden className="size-5 fill-selo text-selo" />
          Avalia
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}

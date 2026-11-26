import type { Metadata } from "next";
import { Geist_Mono, Newsreader, Schibsted_Grotesk } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/client";
import "./globals.css";

/** Interface: grotesca editorial com personalidade. */
const schibsted = Schibsted_Grotesk({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

/** Serifa de leitura: usada só no texto das avaliações. */
const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avalia",
  description:
    "Avalie os produtos que você usa e ajude outras pessoas a escolher.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${schibsted.variable} ${newsreader.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}

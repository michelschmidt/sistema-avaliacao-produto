"use client";

import { Menu } from "@base-ui/react/menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";

type HeaderAccountMenuProps = {
  name: string;
  email: string;
  avatarUrl: string;
};

/** Avatar + nome + email; abre um menu com "Sair". */
export function HeaderAccountMenu({
  name,
  email,
  avatarUrl,
}: HeaderAccountMenuProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const signOut = useMutation(
    trpc.auth.signOut.mutationOptions({
      onSuccess: () => {
        queryClient.clear();
        router.refresh();
      },
    }),
  );

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Conta de ${name}`}
        className="group flex items-center gap-3 rounded-full py-1 pr-1 pl-1 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[popup-open]:bg-muted sm:pl-3"
      >
        <span className="hidden min-w-0 flex-col items-end leading-tight sm:flex">
          <span className="max-w-[18ch] truncate text-sm font-semibold">
            {name}
          </span>
          <span className="max-w-[26ch] truncate text-[0.8125rem] text-muted-foreground">
            {email}
          </span>
        </span>
        {/* biome-ignore lint/performance/noImgElement: SVG externo do DiceBear; next/image exigiria dangerouslyAllowSVG */}
        <img
          src={avatarUrl}
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-full ring-1 ring-border"
        />
        <ChevronDown
          aria-hidden
          className="mr-1 hidden size-4 text-muted-foreground transition-transform group-data-[popup-open]:rotate-180 motion-reduce:transition-none sm:block"
        />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8}>
          <Menu.Popup className="min-w-60 origin-[var(--transform-origin)] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_12px_32px_-12px_rgb(31_42_77/0.35)] outline-none transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            <div className="flex flex-col px-2.5 pt-1.5 pb-2.5 leading-tight">
              <span className="truncate text-sm font-semibold">{name}</span>
              <span className="truncate text-[0.8125rem] text-muted-foreground">
                {email}
              </span>
            </div>
            <Menu.Separator className="mx-1 mb-1 h-px bg-border" />
            <Menu.Item
              closeOnClick={false}
              disabled={signOut.isPending}
              onClick={() => signOut.mutate()}
              className="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-[disabled]:opacity-60 data-[highlighted]:bg-muted"
            >
              {signOut.isPending ? (
                <LoaderCircle aria-hidden className="size-4 animate-spin" />
              ) : (
                <LogOut aria-hidden className="size-4" />
              )}
              {signOut.isPending ? "Saindo..." : "Sair"}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

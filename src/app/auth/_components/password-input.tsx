"use client";

import { Eye, EyeOff } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Campo de senha com botão para mostrar/ocultar o texto digitado. */
export function PasswordInput({
  className,
  disabled,
  ...props
}: Omit<ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("pr-12", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visible}
        className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      >
        {visible ? (
          <EyeOff aria-hidden className="size-4.5" />
        ) : (
          <Eye aria-hidden className="size-4.5" />
        )}
      </button>
    </div>
  );
}

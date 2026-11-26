import { z } from "zod";

/**
 * Schema compartilhado entre o formulário de login (React Hook Form) e a API (tRPC).
 * A senha não repete as regras do cadastro: só checamos presença e o limite do bcrypt.
 */
export const signInSchema = z.object({
  email: z
    .string({ error: "Informe seu email" })
    .trim()
    .toLowerCase()
    .min(1, "Informe seu email")
    .pipe(z.email("Informe um email válido")),
  // bcrypt só considera os primeiros 72 bytes da senha, por isso o limite.
  password: z
    .string({ error: "Informe sua senha" })
    .min(1, "Informe sua senha")
    .max(72, "A senha deve ter no máximo 72 caracteres"),
});

export type SignInInput = z.input<typeof signInSchema>;
export type SignInData = z.output<typeof signInSchema>;

/**
 * Destino seguro após o login: só caminhos internos (`/algo`, nunca `//host` ou `/\host`).
 * Qualquer outro valor cai na home.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (
    typeof next !== "string" ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  ) {
    return "/";
  }
  return next;
}

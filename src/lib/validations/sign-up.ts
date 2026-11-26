import { z } from "zod";

/**
 * Schema compartilhado entre o formulário (React Hook Form) e a API (tRPC).
 * Qualquer mudança aqui vale automaticamente para cliente e servidor.
 */
export const signUpSchema = z
  .object({
    firstName: z
      .string({ error: "Informe seu primeiro nome" })
      .trim()
      .min(1, "Informe seu primeiro nome")
      .max(100, "Use no máximo 100 caracteres"),
    lastName: z
      .string({ error: "Informe seu sobrenome" })
      .trim()
      .min(1, "Informe seu sobrenome")
      .max(100, "Use no máximo 100 caracteres"),
    email: z
      .string({ error: "Informe seu email" })
      .trim()
      .toLowerCase()
      .min(1, "Informe seu email")
      .pipe(z.email("Informe um email válido")),
    // bcrypt só considera os primeiros 72 bytes da senha, por isso o limite.
    password: z
      .string({ error: "Informe uma senha" })
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .max(72, "A senha deve ter no máximo 72 caracteres"),
    confirmPassword: z
      .string({ error: "Confirme sua senha" })
      .min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignUpData = z.output<typeof signUpSchema>;

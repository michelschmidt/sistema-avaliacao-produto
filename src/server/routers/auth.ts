import "server-only";

import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { signInSchema } from "@/lib/validations/sign-in";
import { signUpSchema } from "@/lib/validations/sign-up";
import { createSession, deleteSession } from "@/server/auth/session";
import {
  findAccountByEmail,
  findPublicAccountById,
  insertAccount,
} from "@/server/db/accounts";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";

const BCRYPT_COST = 10;

export const INVALID_CREDENTIALS_MESSAGE = "Email ou senha inválidos.";

/**
 * Hash usado quando o email não existe: o `bcrypt.compare` roda do mesmo jeito,
 * então a resposta 401 leva o mesmo tempo com ou sem conta (evita enumerar emails).
 * Gerado uma vez por processo, com o mesmo custo dos hashes reais.
 */
let dummyHashPromise: Promise<string> | undefined;
function getDummyHash() {
  dummyHashPromise ??= bcrypt.hash(nanoid(), BCRYPT_COST);
  return dummyHashPromise;
}

export const authRouter = createTRPCRouter({
  signUp: publicProcedure.input(signUpSchema).mutation(async ({ input }) => {
    try {
      // O bcrypt gera o salt automaticamente e o embute no próprio hash.
      const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

      return await insertAccount({
        id: nanoid(),
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash,
      });
    } catch (error) {
      console.error("[auth.signUp]", error);
      // Mensagem genérica: não expõe detalhes internos ao cliente.
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível criar sua conta. Tente novamente.",
      });
    }
  }),

  /**
   * Valida email + senha e grava a sessão no cookie.
   * Só funciona dentro de Route Handler (`/api/trpc` ou `/api/v1/sign-in`), onde `cookies().set` é permitido.
   */
  signIn: publicProcedure.input(signInSchema).mutation(async ({ input }) => {
    let accountId: string | null = null;

    try {
      const account = await findAccountByEmail(input.email);
      const passwordOk = await bcrypt.compare(
        input.password,
        account?.passwordHash ?? (await getDummyHash()),
      );
      if (account && passwordOk && account.active) {
        accountId = account.id;
      }
    } catch (error) {
      console.error("[auth.signIn]", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível entrar agora. Tente novamente.",
      });
    }

    // Mesma mensagem para email inexistente, senha errada ou conta inativa.
    if (!accountId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: INVALID_CREDENTIALS_MESSAGE,
      });
    }

    try {
      const account = await findPublicAccountById(accountId);
      if (!account) throw new Error("Conta sumiu entre as consultas");
      await createSession(account.id);
      return account;
    } catch (error) {
      console.error("[auth.signIn]", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível entrar agora. Tente novamente.",
      });
    }
  }),

  /** Conta pública da sessão atual, ou `null` se ninguém entrou. */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session) return null;
    const account = await findPublicAccountById(ctx.session.accountId);
    return account?.active ? account : null;
  }),

  /** Encerra a sessão. Idempotente: sem sessão, apenas não faz nada. */
  signOut: publicProcedure.mutation(async () => {
    await deleteSession();
    return { ok: true as const };
  }),
});

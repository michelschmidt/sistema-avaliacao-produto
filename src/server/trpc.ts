import "server-only";

import { initTRPC, TRPCError } from "@trpc/server";
import { getSession } from "@/server/auth/session";

export type ValidationIssue = { path: string; message: string };

/** Extrai as issues de validação (Standard Schema / Zod) da causa de um erro do tRPC. */
export function getValidationIssues(cause: unknown): ValidationIssue[] | null {
  if (
    typeof cause !== "object" ||
    cause === null ||
    !("issues" in cause) ||
    !Array.isArray(cause.issues)
  ) {
    return null;
  }

  return cause.issues.map(
    (issue: { path?: PropertyKey[]; message: string }) => ({
      path: (issue.path ?? []).map(String).join("."),
      message: issue.message,
    }),
  );
}

export const createTRPCContext = async () => ({
  session: await getSession(),
});

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        validationIssues:
          error.code === "BAD_REQUEST"
            ? getValidationIssues(error.cause)
            : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

/** Exige sessão válida; expõe `ctx.session` como não-nulo. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Entre na sua conta para continuar.",
    });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

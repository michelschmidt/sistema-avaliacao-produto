import { TRPCError } from "@trpc/server";
import { createCaller } from "@/server/routers/_app";
import { createTRPCContext, getValidationIssues } from "@/server/trpc";

/**
 * POST /api/v1/sign-up
 * Adaptador REST fino: toda a regra de negócio vive na procedure tRPC `auth.signUp`.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: "BAD_REQUEST",
        message: "O corpo da requisição deve ser um JSON válido.",
      },
      { status: 400 },
    );
  }

  try {
    const caller = createCaller(await createTRPCContext());
    const account = await caller.auth.signUp(body as never);
    return Response.json({ account }, { status: 200 });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "BAD_REQUEST") {
      return Response.json(
        {
          error: "BAD_REQUEST",
          message: "Dados inválidos.",
          issues: getValidationIssues(error.cause) ?? [],
        },
        { status: 400 },
      );
    }

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível criar sua conta. Tente novamente.",
      },
      { status: 500 },
    );
  }
}

import { TRPCError } from "@trpc/server";
import { createCaller } from "@/server/routers/_app";
import { createTRPCContext, getValidationIssues } from "@/server/trpc";

const STATUS_BY_CODE = {
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
} as const;

/**
 * POST /api/v1/products/:id/feedbacks — corpo JSON `{ score, comment }`.
 * Adaptador REST fino: a regra de negócio vive na procedure tRPC `feedbacks.create`.
 * O produto vem da URL e o autor vem da sessão (cookie), nunca do corpo.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

  const input =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? { ...body, productId: id }
      : body;

  try {
    const caller = createCaller(await createTRPCContext());
    const feedback = await caller.feedbacks.create(input as never);
    return Response.json({ feedback }, { status: 200 });
  } catch (error) {
    if (error instanceof TRPCError) {
      if (error.code === "BAD_REQUEST") {
        return Response.json(
          {
            error: "BAD_REQUEST",
            message: "Dados inválidos.",
            issues: getValidationIssues(error.cause) ?? [],
          },
          { status: 400 },
        );
      }

      if (error.code === "UNAUTHORIZED" || error.code === "NOT_FOUND") {
        return Response.json(
          { error: error.code, message: error.message },
          { status: STATUS_BY_CODE[error.code] },
        );
      }
    }

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível publicar sua avaliação. Tente novamente.",
      },
      { status: 500 },
    );
  }
}

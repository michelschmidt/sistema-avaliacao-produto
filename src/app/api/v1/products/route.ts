import { TRPCError } from "@trpc/server";
import { createCaller } from "@/server/routers/_app";
import { createTRPCContext, getValidationIssues } from "@/server/trpc";

/**
 * Adaptadores REST finos: a regra de negócio vive nas procedures tRPC
 * `products.list` e `products.create`.
 */

function badRequest(error: TRPCError) {
  return Response.json(
    {
      error: "BAD_REQUEST",
      message:
        error.message === "Cursor inválido."
          ? error.message
          : "Dados inválidos.",
      issues: getValidationIssues(error.cause) ?? [],
    },
    { status: 400 },
  );
}

/** GET /api/v1/products?cursor=&limit= → 200 `{ items, nextCursor }`. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const input = {
    cursor: params.get("cursor") || undefined,
    limit: params.get("limit") || undefined,
  };

  try {
    const caller = createCaller(await createTRPCContext());
    const page = await caller.products.list(input as never);
    return Response.json(page, { status: 200 });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "BAD_REQUEST") {
      return badRequest(error);
    }

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível carregar os produtos. Tente novamente.",
      },
      { status: 500 },
    );
  }
}

/** POST /api/v1/products — JSON `{ name, externalLink, imageUrl, description? }`. */
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
    const product = await caller.products.create(body as never);
    return Response.json({ product }, { status: 200 });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "BAD_REQUEST") {
      return badRequest(error);
    }

    return Response.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível cadastrar o produto. Tente novamente.",
      },
      { status: 500 },
    );
  }
}

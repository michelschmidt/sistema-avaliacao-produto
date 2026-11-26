import "server-only";

import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import {
  createProductSchema,
  decodeProductCursor,
  encodeProductCursor,
  listProductsSchema,
} from "@/lib/validations/products";
import { insertProduct, listProducts } from "@/server/db/products";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";

export const productsRouter = createTRPCRouter({
  /** Listagem pública paginada por cursor (infinite scroll da home). */
  list: publicProcedure.input(listProductsSchema).query(async ({ input }) => {
    const cursor = input.cursor ? decodeProductCursor(input.cursor) : null;
    if (input.cursor && !cursor) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cursor inválido.",
      });
    }

    try {
      const page = await listProducts({ cursor, limit: input.limit });
      return {
        items: page.items,
        nextCursor: page.next ? encodeProductCursor(page.next) : null,
      };
    } catch (error) {
      console.error("[products.list]", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível carregar os produtos. Tente novamente.",
      });
    }
  }),

  /** Cadastro manual de produto (aberto, sem autenticação — projeto de estudo). */
  create: publicProcedure
    .input(createProductSchema)
    .mutation(async ({ input }) => {
      try {
        return await insertProduct({
          id: nanoid(),
          name: input.name,
          description: input.description,
          imageUrl: input.imageUrl,
          externalLink: input.externalLink,
        });
      } catch (error) {
        console.error("[products.create]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível cadastrar o produto. Tente novamente.",
        });
      }
    }),
});

import "server-only";

import { createCallerFactory, createTRPCRouter } from "@/server/trpc";
import { authRouter } from "./auth";
import { feedbacksRouter } from "./feedbacks";
import { productsRouter } from "./products";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  products: productsRouter,
  feedbacks: feedbacksRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

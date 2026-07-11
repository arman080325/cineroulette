import { PrismaClient } from "@prisma/client";

// Shared singleton so the Next.js app, sync worker, and scoring package
// all reuse one connection pool config rather than each instantiating their own.
declare global {
  // eslint-disable-next-line no-var
  var __cineroulette_prisma__: PrismaClient | undefined;
}

export const prisma =
  global.__cineroulette_prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__cineroulette_prisma__ = prisma;
}

export * from "@prisma/client";

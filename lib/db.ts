// lib/db.ts
// Prisma client singleton for the OpenSolar integration.
// Uses the libsql adapter for SQLite (Prisma 7).

import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "@prisma/client"

const dbUrl       = process.env.DATABASE_URL ?? "file:./dev.db"
const authToken   = process.env.TURSO_AUTH_TOKEN

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url: dbUrl, authToken })
  return new PrismaClient({ adapter })
}

// Prevent multiple Prisma instances in development hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

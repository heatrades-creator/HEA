// prisma.config.ts
// Prisma 7 configuration for SQLite via libsql adapter (Turso).

import path from "path"
import { defineConfig } from "prisma/config"

const dbUrl     = process.env.DATABASE_URL ?? "file:./dev.db"
const authToken = process.env.TURSO_AUTH_TOKEN

// Embed auth token in URL for Prisma CLI commands (db push, migrate)
// libsql:// URLs support ?authToken= as a query parameter
const datasourceUrl = authToken ? `${dbUrl}?authToken=${authToken}` : dbUrl

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
})

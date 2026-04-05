// prisma.config.ts
// Prisma 7 configuration for SQLite via libsql adapter.

import path from "path"
import { defineConfig } from "prisma/config"

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db"

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: dbUrl,
  },
})

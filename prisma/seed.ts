// prisma/seed.ts
// Seeds the database with one test lead and default SystemConfig rows.
// Run: npx prisma db seed  (or: DATABASE_URL="file:./dev.db" npx tsx prisma/seed.ts)

import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "@prisma/client"

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db"
const adapter = new PrismaLibSql({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log(`Seeding database at ${dbUrl}…`)

  // Default feature flags (all off by default)
  const configDefaults = [
    { key: "ada_widget_enabled",          value: "false" },
    { key: "ada_auto_creates_projects",   value: "unknown" },
    { key: "cashflow_enabled",            value: "false" },
    { key: "integrated_finance_enabled",  value: "false" },
    { key: "esignature_enabled",          value: "false" },
    { key: "auto_design_enabled",         value: "false" },
    { key: "supplier_assist_enabled",     value: "false" },
    { key: "permitting_enabled",          value: "false" },
    { key: "premium_imagery_enabled",     value: "false" },
  ]

  for (const config of configDefaults) {
    await prisma.systemConfig.upsert({
      where:  { key: config.key },
      update: {},
      create: config,
    })
  }
  console.log(`  ✓ ${configDefaults.length} SystemConfig defaults set`)

  // Test lead
  const existing = await prisma.lead.findFirst({
    where: { email: "test@example.com" },
  })

  if (!existing) {
    const lead = await prisma.lead.create({
      data: {
        firstName:     "Jane",
        lastName:      "Smith",
        email:         "test@example.com",
        phone:         "0400 000 000",
        address:       "123 Solar Street",
        suburb:        "Bendigo",
        state:         "VIC",
        postcode:      "3550",
        annualBillAud: 2500,
        roofType:      "tile",
        storeys:       1,
        notes:         "Test lead — created by prisma seed. Safe to delete.",
        leadSource:    "website",
        status:        "pending_review",
        auditLog: {
          create: {
            action: "lead_received",
            actor:  "system",
            detail: JSON.stringify({ seeded: true }),
          },
        },
      },
    })
    console.log(`  ✓ Test lead created: ${lead.id}`)
  } else {
    console.log(`  ✓ Test lead already exists, skipping`)
  }

  console.log("Seed complete.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

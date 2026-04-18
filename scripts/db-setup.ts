#!/usr/bin/env tsx
// scripts/db-setup.ts
//
// Creates database tables in Turso using @libsql/client directly.
// Replaces `prisma db push` which cannot connect to libsql:// URLs.
// Safe to run multiple times — uses CREATE TABLE IF NOT EXISTS throughout.

import { createClient } from "@libsql/client"

const url       = process.env.DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url) {
  console.error("DATABASE_URL is not set")
  process.exit(1)
}

const db = createClient({ url, authToken })

const statements = [
  // ── Lead ──────────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "Lead" (
    "id"                   TEXT     NOT NULL PRIMARY KEY,
    "createdAt"            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstName"            TEXT     NOT NULL,
    "lastName"             TEXT     NOT NULL,
    "email"                TEXT     NOT NULL,
    "phone"                TEXT     NOT NULL,
    "address"              TEXT     NOT NULL,
    "suburb"               TEXT     NOT NULL,
    "state"                TEXT     NOT NULL,
    "postcode"             TEXT     NOT NULL,
    "annualBillAud"        INTEGER,
    "roofType"             TEXT,
    "storeys"              INTEGER,
    "notes"                TEXT,
    "leadSource"           TEXT     NOT NULL DEFAULT 'website',
    "status"               TEXT     NOT NULL DEFAULT 'pending_review',
    "openSolarProjectId"   INTEGER,
    "openSolarCreatedAt"   DATETIME,
    "openSolarCreatedBy"   TEXT,
    "openSolarShareLink"   TEXT,
    "openSolarStage"       TEXT,
    "openSolarSystemKw"    REAL,
    "openSolarOutputKwh"   REAL,
    "openSolarPriceAud"    REAL,
    "apiCostAud"           REAL,
    "apiCostSnapshot"      TEXT,
    "proposalSentAt"       DATETIME,
    "proposalViewedAt"     DATETIME,
    "proposalAcceptedAt"   DATETIME,
    "financeApprovedAt"    DATETIME,
    "contractSignedAt"     DATETIME,
    "depositPaidAt"        DATETIME,
    "permitSubmittedAt"    DATETIME,
    "soldAt"               DATETIME,
    "installedAt"          DATETIME,
    "proposalToken"        TEXT     NOT NULL UNIQUE DEFAULT (lower(hex(randomblob(16))))
  )`,

  // ── AuditEntry ────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "AuditEntry" (
    "id"        TEXT     NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId"    TEXT     NOT NULL,
    "action"    TEXT     NOT NULL,
    "actor"     TEXT     NOT NULL,
    "detail"    TEXT,
    "costAud"   REAL,
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  )`,

  // ── SystemConfig ──────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "SystemConfig" (
    "id"    TEXT NOT NULL PRIMARY KEY,
    "key"   TEXT NOT NULL UNIQUE,
    "value" TEXT NOT NULL
  )`,

  // ── Indexes ───────────────────────────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS "Lead_email_idx"    ON "Lead"("email")`,
  `CREATE INDEX IF NOT EXISTS "Lead_status_idx"   ON "Lead"("status")`,
  `CREATE INDEX IF NOT EXISTS "AuditEntry_leadId_idx" ON "AuditEntry"("leadId")`,
]

// Columns added after initial schema — safe to run on existing databases
const migrations = [
  `ALTER TABLE "Lead" ADD COLUMN "gasJobNumber"      TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN "gasDriveUrl"       TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN "nmiNumber"         TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN "nmiConsentAt"      DATETIME`,
  `ALTER TABLE "Lead" ADD COLUMN "nmiSignatureB64"   TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN "advisorAnswers"    TEXT`,
  // Household profile (intake form)
  `ALTER TABLE "Lead" ADD COLUMN "occupants"         TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN "homeDaytime"       TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN "hotWater"          TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN "gasAppliances"     TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN "ev"                TEXT`,
  // HubSpot CRM
  `ALTER TABLE "Lead" ADD COLUMN "hubSpotContactId"  TEXT`,
  `ALTER TABLE "Lead" ADD COLUMN "hubSpotDealId"     TEXT`,
]

async function main() {
  console.log("Setting up database tables...")

  for (const sql of statements) {
    await db.execute(sql)
  }

  // Run migrations — ignore "duplicate column" errors (column already exists)
  for (const sql of migrations) {
    try {
      await db.execute(sql)
    } catch {
      // Column already exists — safe to ignore
    }
  }

  console.log("✔ Database tables ready")
  process.exit(0)
}

main().catch((err) => {
  console.error("Database setup failed:", err)
  process.exit(1)
})

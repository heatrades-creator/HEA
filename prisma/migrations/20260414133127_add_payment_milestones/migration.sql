-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "annualBillAud" INTEGER,
    "roofType" TEXT,
    "storeys" INTEGER,
    "notes" TEXT,
    "leadSource" TEXT NOT NULL DEFAULT 'website',
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "openSolarProjectId" INTEGER,
    "openSolarCreatedAt" DATETIME,
    "openSolarCreatedBy" TEXT,
    "openSolarShareLink" TEXT,
    "openSolarStage" TEXT,
    "openSolarSystemKw" REAL,
    "openSolarOutputKwh" REAL,
    "openSolarPriceAud" REAL,
    "gasJobNumber" TEXT,
    "gasDriveUrl" TEXT,
    "nmiNumber" TEXT,
    "nmiConsentAt" DATETIME,
    "nmiSignatureB64" TEXT,
    "advisorAnswers" TEXT,
    "apiCostAud" REAL,
    "apiCostSnapshot" TEXT,
    "proposalSentAt" DATETIME,
    "proposalViewedAt" DATETIME,
    "proposalAcceptedAt" DATETIME,
    "financeApprovedAt" DATETIME,
    "contractSignedAt" DATETIME,
    "depositPaidAt" DATETIME,
    "completionPaidAt" DATETIME,
    "esvPaidAt" DATETIME,
    "permitSubmittedAt" DATETIME,
    "soldAt" DATETIME,
    "installedAt" DATETIME,
    "proposalToken" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AuditEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "detail" TEXT,
    "costAud" REAL,
    CONSTRAINT "AuditEntry_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_proposalToken_key" ON "Lead"("proposalToken");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

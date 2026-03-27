-- AlterTable (safe: skip if columns already exist)
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "lsCustomerId" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "lsSubscriptionId" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "billingExempt" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex (safe: skip if already exist)
CREATE UNIQUE INDEX IF NOT EXISTS "Business_lsCustomerId_key" ON "Business"("lsCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Business_lsSubscriptionId_key" ON "Business"("lsSubscriptionId");

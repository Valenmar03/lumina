-- AlterTable
ALTER TABLE "Business" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Business" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "Business" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Business" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'ARS';
ALTER TABLE "Business" ADD COLUMN "billingExempt" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Business_stripeCustomerId_key" ON "Business"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Business_stripeSubscriptionId_key" ON "Business"("stripeSubscriptionId");

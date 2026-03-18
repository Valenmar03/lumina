-- CreateTable
CREATE TABLE "ProfessionalUnavailability" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalUnavailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfessionalUnavailability_professionalId_startAt_idx" ON "ProfessionalUnavailability"("professionalId", "startAt");

-- CreateIndex
CREATE INDEX "ProfessionalUnavailability_businessId_idx" ON "ProfessionalUnavailability"("businessId");

-- AddForeignKey
ALTER TABLE "ProfessionalUnavailability" ADD CONSTRAINT "ProfessionalUnavailability_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalUnavailability" ADD CONSTRAINT "ProfessionalUnavailability_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

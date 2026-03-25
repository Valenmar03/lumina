-- AlterTable: add WhatsApp fields to Business
ALTER TABLE "Business" ADD COLUMN "waPhoneNumberId" TEXT;
ALTER TABLE "Business" ADD COLUMN "waAccessToken" TEXT;
ALTER TABLE "Business" ADD COLUMN "waReminderHours" INTEGER;

-- AlterTable: add reminderSentAt to Appointment
ALTER TABLE "Appointment" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

-- AlterTable: add phone to User
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

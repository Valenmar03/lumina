-- AlterTable
ALTER TABLE "Business" ADD COLUMN "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Business" ADD COLUMN "emailReminderHours" INTEGER DEFAULT 24;

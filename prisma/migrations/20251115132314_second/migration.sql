/*
  Warnings:

  - You are about to drop the column `created_at` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `max_retries` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Job` table. All the data in the column will be lost.
  - The `state` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "created_at",
DROP COLUMN "max_retries",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "maxRetries" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "state",
ADD COLUMN     "state" TEXT NOT NULL DEFAULT 'pending';

-- DropEnum
DROP TYPE "JobState";

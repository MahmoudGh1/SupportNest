-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "scheduledDeletionAt";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "scheduledDeletionAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "contact_submissions";

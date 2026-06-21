-- AlterTable
ALTER TABLE "tool_definitions" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "tool_definitions_isPublic_idx" ON "tool_definitions"("isPublic");

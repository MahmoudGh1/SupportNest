/*
  Warnings:

  - A unique constraint covering the columns `[conversationId]` on the table `reports` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "reports_conversationId_key" ON "reports"("conversationId");

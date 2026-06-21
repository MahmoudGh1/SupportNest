-- AlterTable
ALTER TABLE "ContactSubmission" ADD COLUMN     "company" TEXT;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "scheduledDeletionAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "email_verifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_tables" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" "HttpMethod" NOT NULL DEFAULT 'GET',
    "toolDefinitionId" UUID,
    "columnConfig" JSONB NOT NULL DEFAULT '[]',
    "lastFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_table_rows" (
    "id" UUID NOT NULL,
    "tableId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "externalId" TEXT,
    "rowData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_table_rows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_verifications_userId_idx" ON "email_verifications"("userId");

-- CreateIndex
CREATE INDEX "email_verifications_email_idx" ON "email_verifications"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "business_tables_organizationId_idx" ON "business_tables"("organizationId");

-- CreateIndex
CREATE INDEX "business_table_rows_tableId_idx" ON "business_table_rows"("tableId");

-- CreateIndex
CREATE INDEX "business_table_rows_organizationId_idx" ON "business_table_rows"("organizationId");

-- CreateIndex
CREATE INDEX "business_table_rows_tableId_externalId_idx" ON "business_table_rows"("tableId", "externalId");

-- AddForeignKey
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_tables" ADD CONSTRAINT "business_tables_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_tables" ADD CONSTRAINT "business_tables_toolDefinitionId_fkey" FOREIGN KEY ("toolDefinitionId") REFERENCES "tool_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_table_rows" ADD CONSTRAINT "business_table_rows_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "business_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

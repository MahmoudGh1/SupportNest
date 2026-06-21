-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'SUPPORT_AGENT');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('CUSTOMER', 'AI', 'HUMAN_AGENT');

-- CreateEnum
CREATE TYPE "AgentTier" AS ENUM ('ROUTER', 'TIER0', 'TIER1', 'TIER2');

-- CreateEnum
CREATE TYPE "AgentAction" AS ENUM ('RESOLVED', 'ESCALATED_TO_TIER1', 'ESCALATED_TO_TIER2', 'ESCALATED_TO_HUMAN', 'REJECTED_OUTPUT', 'NO_MATCH', 'ESCALATED_TO_TIER0');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "KnowledgeDocumentType" AS ENUM ('PDF', 'URL', 'TEXT', 'DOCX', 'CSV', 'API_DOC', 'SWAGGER_URL');

-- CreateEnum
CREATE TYPE "KnowledgeDocumentStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "ResolutionTier" AS ENUM ('TIER0', 'TIER1', 'TIER2', 'HUMAN', 'UNRESOLVED');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "MessageTier" AS ENUM ('TIER0', 'TIER1', 'TIER2');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ApiAuthType" AS ENUM ('API_KEY', 'BEARER', 'BASIC');

-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('organization_registered', 'organization_suspended', 'organization_reactivated', 'user_added', 'user_deleted', 'payment_completed', 'ticket_escalated', 'csat_submitted', 'contact_us_submitted', 'new_customer_first_contact');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "widgetSecret" TEXT NOT NULL,
    "widgetConfig" JSONB NOT NULL DEFAULT '{}',
    "planId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "scheduledDeletionAt" TIMESTAMP(3),
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_api_configs" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "authType" "ApiAuthType" NOT NULL,
    "authValue" TEXT NOT NULL,
    "headerName" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" TIMESTAMP(3),
    "testEndpoint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_api_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_definitions" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "apiConfigId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "method" "HttpMethod" NOT NULL,
    "path" TEXT NOT NULL,
    "documentId" UUID,
    "parameters" JSONB NOT NULL,
    "responseSchema" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allowedOrigins" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "externalId" TEXT,
    "email" TEXT,
    "name" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "apiKeyId" UUID NOT NULL,
    "conversationStatus" "ConversationStatus" NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "tier" "MessageTier",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_logs" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "tier" "AgentTier" NOT NULL,
    "action" "AgentAction" NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "assignedToId" UUID,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "resolutionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "issueType" TEXT,
    "issueDescription" TEXT,
    "language" TEXT,
    "escalationReason" TEXT,
    "tiersVisited" "AgentTier"[],
    "knowledgeResults" JSONB NOT NULL DEFAULT '[]',
    "agentAttempts" INTEGER NOT NULL DEFAULT 0,
    "customerMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" "KnowledgeDocumentType" NOT NULL,
    "storagePath" TEXT,
    "status" "KnowledgeDocumentStatus" NOT NULL,
    "toolCount" INTEGER NOT NULL DEFAULT 0,
    "activeToolCount" INTEGER NOT NULL DEFAULT 0,
    "disabledToolCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "csat_ratings" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "csat_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_analytics" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "resolvedByTier" "ResolutionTier" NOT NULL,
    "totalMessages" INTEGER NOT NULL,
    "firstResponseTimeMs" INTEGER NOT NULL,
    "resolutionTimeMs" INTEGER NOT NULL,
    "escalatedToTier2" BOOLEAN NOT NULL DEFAULT false,
    "escalatedToHuman" BOOLEAN NOT NULL DEFAULT false,
    "tokensUsed" INTEGER NOT NULL,
    "csatScore" INTEGER,
    "inferredSentiment" "Sentiment",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "priceMonthly" DECIMAL(10,2) NOT NULL,
    "maxConversations" INTEGER,
    "maxAgents" INTEGER,
    "maxKnowledgeDocuments" INTEGER,
    "features" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "pricingId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "paymentProvider" TEXT NOT NULL,
    "providerPaymentId" TEXT NOT NULL,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SUPPORT_AGENT',
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "invitedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "tiersVisited" "AgentTier"[],
    "wasEscalated" BOOLEAN NOT NULL DEFAULT false,
    "resolvedByAi" BOOLEAN NOT NULL DEFAULT true,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" UUID NOT NULL,
    "notificationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT,
    "company" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "business_api_configs_organizationId_key" ON "business_api_configs"("organizationId");

-- CreateIndex
CREATE INDEX "tool_definitions_organizationId_idx" ON "tool_definitions"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "customers_organizationId_idx" ON "customers"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_organizationId_externalId_key" ON "customers"("organizationId", "externalId");

-- CreateIndex
CREATE INDEX "conversations_organizationId_idx" ON "conversations"("organizationId");

-- CreateIndex
CREATE INDEX "conversations_customerId_idx" ON "conversations"("customerId");

-- CreateIndex
CREATE INDEX "conversations_conversationStatus_idx" ON "conversations"("conversationStatus");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "agent_logs_conversationId_idx" ON "agent_logs"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_conversationId_key" ON "tickets"("conversationId");

-- CreateIndex
CREATE INDEX "tickets_organizationId_idx" ON "tickets"("organizationId");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "knowledge_documents_organizationId_idx" ON "knowledge_documents"("organizationId");

-- CreateIndex
CREATE INDEX "knowledge_documents_status_idx" ON "knowledge_documents"("status");

-- CreateIndex
CREATE INDEX "document_chunks_documentId_idx" ON "document_chunks"("documentId");

-- CreateIndex
CREATE INDEX "document_chunks_organizationId_idx" ON "document_chunks"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "csat_ratings_conversationId_key" ON "csat_ratings"("conversationId");

-- CreateIndex
CREATE INDEX "csat_ratings_organizationId_idx" ON "csat_ratings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_analytics_conversationId_key" ON "conversation_analytics"("conversationId");

-- CreateIndex
CREATE INDEX "conversation_analytics_organizationId_idx" ON "conversation_analytics"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerPaymentId_key" ON "payments"("providerPaymentId");

-- CreateIndex
CREATE INDEX "payments_organizationId_idx" ON "payments"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_organizationId_idx" ON "invitations"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "reports_conversationId_key" ON "reports"("conversationId");

-- CreateIndex
CREATE INDEX "reports_organizationId_idx" ON "reports"("organizationId");

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

-- CreateIndex
CREATE INDEX "Notification_organizationId_idx" ON "Notification"("organizationId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "NotificationRecipient_userId_readAt_createdAt_idx" ON "NotificationRecipient"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRecipient_notificationId_userId_key" ON "NotificationRecipient"("notificationId", "userId");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pricing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_api_configs" ADD CONSTRAINT "business_api_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_definitions" ADD CONSTRAINT "tool_definitions_apiConfigId_fkey" FOREIGN KEY ("apiConfigId") REFERENCES "business_api_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_definitions" ADD CONSTRAINT "tool_definitions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "knowledge_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_definitions" ADD CONSTRAINT "tool_definitions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_logs" ADD CONSTRAINT "agent_logs_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "knowledge_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csat_ratings" ADD CONSTRAINT "csat_ratings_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csat_ratings" ADD CONSTRAINT "csat_ratings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csat_ratings" ADD CONSTRAINT "csat_ratings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_analytics" ADD CONSTRAINT "conversation_analytics_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_analytics" ADD CONSTRAINT "conversation_analytics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "pricing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


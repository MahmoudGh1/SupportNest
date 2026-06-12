/**
 * @swagger
 * tags:
 *   name: RAG Engine
 *   description: Core Retrieval-Augmented Generation (RAG) and automated AI support agent routing workflows
 */

/**
 * @swagger
 * /api/v1/rag/ask:
 *   post:
 *     summary: Query the Tier-0 AI assistant
 *     description: Public operational endpoint that routes customer inquiries through the organization's synced vector knowledge base context to provide intelligent, contextual agent responses.
 *     tags: [RAG Engine]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - organizationId
 *             properties:
 *               question:
 *                 type: string
 *                 example: How do I request a custom refund within 30 days?
 *               organizationId:
 *                 type: string
 *                 example: org_01h7abc123xyz
 *     responses:
 *       200:
 *         description: Vector search complete and intelligent resolution text generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 response:
 *                   type: string
 *                   example: Based on Acme Corp's policy, returns within 30 days are eligible for full store credit.
 *                 confidenceScore:
 *                   type: number
 *                   example: 0.94
 *       400:
 *         description: Missing or completely empty prompt strings, or invalid target organization context references.
 *       500:
 *         description: Internal search query indexing or vector completion engine pipeline exception.
 */

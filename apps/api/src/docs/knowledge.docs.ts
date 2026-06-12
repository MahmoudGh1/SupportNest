/**
 * @swagger
 * tags:
 *   name: Knowledge Base
 *   description: Management of knowledge base documents, Swagger APIs, and custom agent tools
 */

/**
 * @swagger
 * /api/v1/knowledge/{orgId}/documents/swagger:
 *   post:
 *     summary: Upload a Swagger documentation URL
 *     description: Links a functional remote Swagger endpoint to the organization's RAG framework. Requires a pre-verified API configuration connection context.
 *     tags: [Knowledge Base]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the target organization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - swaggerUrl
 *             properties:
 *               title:
 *                 type: string
 *                 example: Core Business API Docs
 *               swaggerUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://api.example.com/swagger/json
 *     responses:
 *       202:
 *         description: Structural API link stored and chunking engine task successfully queued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 documentId:
 *                   type: string
 *                   example: doc_01h7abc999xyz
 *                 status:
 *                   type: string
 *                   example: PROCESSING
 *       400:
 *         description: Malformed structural link string, or the enterprise business API integration has not been established and verified.
 *       401:
 *         description: Unauthorized session context
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/knowledge/documents/{documentId}/tools:
 *   get:
 *     summary: Get all tools derived from a document context
 *     description: Returns a collection of custom automated agent functions parsed out of the targeted operational document context.
 *     tags: [Knowledge Base]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique structural identifier of the knowledge base document record
 *     responses:
 *       200:
 *         description: Collection of document execution tools successfully loaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tools:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: tool_01j9xyz555abc
 *                       name:
 *                         type: string
 *                         example: checkInventory
 *                       description:
 *                         type: string
 *                         example: Automatically queries external systems to verify stock availability
 *                       isEnabled:
 *                         type: boolean
 *                         example: true
 *       401:
 *         description: Unauthorized session context
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/knowledge/tools/{toolId}/toggle:
 *   patch:
 *     summary: Enable or disable an automated agent tool
 *     description: Toggles the state of a specific operational tool to control its execution visibility inside the active AI routing tier.
 *     tags: [Knowledge Base]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: toolId
 *         required: true
 *         schema:
 *           type: string
 *         description: The specific unique tool configuration entity ID
 *     responses:
 *       200:
 *         description: Tool state modified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Tool state updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: tool_01j9xyz555abc
 *                     isEnabled:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Unauthorized session context
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/knowledge/tools/active:
 *   get:
 *     summary: Fetch active enterprise tools
 *     description: Extracts all current available automated execution utility configurations actively exposed within the authenticated identity's structural perimeter.
 *     tags: [Knowledge Base]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Global collection list of active functional parameters compiled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activeTools:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: tool_01j9xyz555abc
 *                       name:
 *                         type: string
 *                         example: processRefund
 *                       organizationId:
 *                         type: string
 *                         example: org_01h7abc123xyz
 *       401:
 *         description: Unauthorized session context
 *       500:
 *         description: Internal server error
 */

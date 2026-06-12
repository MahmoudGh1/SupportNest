/**
 * @swagger
 * tags:
 *   name: Conversations
 *   description: Conversations, messaging, and AI agent integration APIs
 */

/**
 * @swagger
 * /api/v1/conversations:
 *   post:
 *     summary: Start a new conversation
 *     description: Initializes a conversation session for an authenticated customer (via JWT) or an anonymous user. Requires a valid API Key in the headers.
 *     tags: [Conversations]
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: Application/Widget API key
 *       - in: header
 *         name: authorization
 *         required: false
 *         schema:
 *           type: string
 *           placeholder: Bearer <token>
 *         description: JWT bearer token identifying an authenticated external customer
 *     responses:
 *       201:
 *         description: Conversation created successfully
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
 *                   example: Conversation created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversationId:
 *                       type: string
 *                       example: clvk123450000jk8s9zxxb8a1
 *                     status:
 *                       type: string
 *                       example: ACTIVE
 *       400:
 *         description: Bad request. Your API key does not belong to any organization.
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/conversations/{id}/messages:
 *   post:
 *     summary: Send a message in a conversation
 *     description: Appends a customer message to an active conversation and triggers the AI RAG workflow pipeline to process and reply.
 *     tags: [Conversations]
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: Application/Widget API key
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the conversation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: Hello, I need help resetting my password.
 *     responses:
 *       201:
 *         description: Message successfully processed and responded to by the AI agent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: msg_01h7abc123xyz
 *                     role:
 *                       type: string
 *                       example: AI
 *                     content:
 *                       type: string
 *                       example: I can help you reset your password. Please check your email for a reset link.
 *                     tier:
 *                       type: string
 *                       example: TIER1
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-06-12T03:36:17.000Z
 *                 action:
 *                   type: string
 *                   example: RESOLVED
 *       400:
 *         description: Conversation not found, already closed, or does not belong to the current organization context
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/conversations/{id}/messages:
 *   get:
 *     summary: Get all messages for a specific conversation
 *     description: Retrieves the full chronological historical message list for an active conversation context.
 *     tags: [Conversations]
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: Application/Widget API key
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the conversation
 *     responses:
 *       200:
 *         description: Chronological list of conversation messages fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: msg_01h7abc123xyz
 *                       role:
 *                         type: string
 *                         example: CUSTOMER
 *                       content:
 *                         type: string
 *                         example: Hello, I need help resetting my password.
 *                       tier:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-06-12T03:34:10.000Z
 *       404:
 *         description: Conversation not found or does not belong to this organization's context
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * tags:
 *   name: Reports & Analytics
 *   description: Operational insights, conversation intelligence metrics, and chat history audit logs
 */

/**
 * @swagger
 * /api/v1/reports:
 *   get:
 *     summary: List all organization reports
 *     description: Retrieves a collection of compiled conversation summaries, metadata insights, escalation audits, and token utility flags for the authenticated organization context.
 *     tags: [Reports & Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Collection of summarized analytic reports loaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reports:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: rep_01j9abc789xyz
 *                       conversationId:
 *                         type: string
 *                         example: clvk123450000jk8s9zxxb8a1
 *                       summary:
 *                         type: string
 *                         example: User requested structural password assistance and completed setup.
 *                       issueType:
 *                         type: string
 *                         example: ACCOUNT_ACCESS
 *                       resolution:
 *                         type: string
 *                         example: Solved via self-service activation link
 *                       language:
 *                         type: string
 *                         example: en
 *                       sentiment:
 *                         type: string
 *                         example: POSITIVE
 *                       tiersVisited:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: TIER0
 *                       wasEscalated:
 *                         type: boolean
 *                         example: false
 *                       resolvedByAi:
 *                         type: boolean
 *                         example: true
 *                       tokensUsed:
 *                         type: integer
 *                         example: 1420
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-06-12T03:34:10.000Z
 *       401:
 *         description: Unauthorized session context
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/reports/{id}:
 *   get:
 *     summary: Retrieve a detailed conversation report by ID
 *     description: Fetches a single analytical report alongside deeply resolved structures, including customer profile matrices and chronological message history logs.
 *     tags: [Reports & Analytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique database identifier of the report record
 *     responses:
 *       200:
 *         description: Comprehensive analytics report and historical deep payload fetched cleanly
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: rep_01j9abc789xyz
 *                 conversationId:
 *                   type: string
 *                   example: clvk123450000jk8s9zxxb8a1
 *                 summary:
 *                   type: string
 *                   example: User asked for billing exceptions; escalated immediately to human tiers.
 *                 issueType:
 *                   type: string
 *                   example: BILLING
 *                 resolution:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 language:
 *                   type: string
 *                   example: en
 *                 sentiment:
 *                   type: string
 *                   example: NEUTRAL
 *                 tiersVisited:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: TIER1
 *                 wasEscalated:
 *                   type: boolean
 *                   example: true
 *                 resolvedByAi:
 *                   type: boolean
 *                   example: false
 *                 tokensUsed:
 *                   type: integer
 *                   example: 840
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-06-12T03:40:12.000Z
 *                 conversation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clvk123450000jk8s9zxxb8a1
 *                     conversationStatus:
 *                       type: string
 *                       example: ESCALATED
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-06-12T03:38:00.000Z
 *                 customer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: cst_01h7abc555qwe
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: john@example.com
 *                     isAnonymous:
 *                       type: boolean
 *                       example: false
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
 *                         example: Can I wave the setup fee for this annual subscription?
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-06-12T03:38:05.000Z
 *       401:
 *         description: Unauthorized session context
 *       404:
 *         description: Report entity not found or cross-organizational domain scope collision detected
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * tags:
 *   name: Tools
 *   description: Management of automated agent execution tools extracted from knowledge base schemas
 */

/**
 * @swagger
 * /api/v1/tools/tools/{toolId}/toggle:
 *   patch:
 *     summary: Toggle tool active state
 *     description: Inverts the activation status of a specific agent tool definition. Automatically recalculates cache counters on its parent document record.
 *     tags: [Tools]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: toolId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique operational identifier of the target tool
 *     responses:
 *       200:
 *         description: Tool activation state toggled and counter matrices calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: tl_01h8abc999xyz
 *                 isActive:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Tool enabled successfully
 *       401:
 *         description: Unauthorized session context
 *       404:
 *         description: Tool not found or tenant domain collision detected
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/tools/tools/active:
 *   get:
 *     summary: Get all active tools for the organization
 *     description: Compiles a complete list of all currently active automated tools across the caller's organization context.
 *     tags: [Tools]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Active organizational tools schema payload retrieved cleanly
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
 *                         example: tl_01h8abc999xyz
 *                       name:
 *                         type: string
 *                         example: checkShippingStatus
 *                       description:
 *                         type: string
 *                         example: Automatically fetches carrier updates via the external shipping API.
 *                       method:
 *                         type: string
 *                         example: GET
 *                       path:
 *                         type: string
 *                         example: /v2/shipments/{trackingId}
 *                       parameters:
 *                         type: object
 *                         example: { "type": "object", "properties": { "trackingId": { "type": "string" } } }
 *                       responseSchema:
 *                         type: object
 *                         example: { "type": "object", "properties": { "status": { "type": "string" } } }
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-06-12T03:34:10.000Z
 *       401:
 *         description: Unauthorized session context
 *       500:
 *         description: Internal server error
 */

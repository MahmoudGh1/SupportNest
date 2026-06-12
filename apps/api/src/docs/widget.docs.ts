/**
 * @swagger
 * tags:
 *   name: Widget
 *   description: Public client initialization vectors for embedded customer chat widgets
 */

/**
 * @swagger
 * /api/v1/widget/init:
 *   post:
 *     summary: Initialize the client chat widget
 *     description: Public initialization handshake designed for external web surfaces. Validates the calling container domain origin along with the header API key to surface contextual styling, active state metadata, and track persistent anonymous session identifiers.
 *     tags: [Widget]
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique public integration key provisioned for the organization
 *       - in: header
 *         name: origin
 *         required: false
 *         schema:
 *           type: string
 *           format: uri
 *         description: The external domain origin URL executing the embed script
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerToken:
 *                 type: string
 *                 description: Optional secure authentication token representing a known logged-in platform user
 *                 example: jwt_visitor_signature_123
 *               visitorId:
 *                 type: string
 *                 description: Persistent fingerprint client tracking UUID string or hardware fallback token
 *                 example: vis_01h8abc222xyz
 *     responses:
 *       200:
 *         description: Validation success; widget state properties and structural configuration returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 organization:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Acme Corp Support
 *                 config:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: Live Chat
 *                     greetingMessage:
 *                       type: string
 *                       example: Welcome back! How can we assist you?
 *                     accentColor:
 *                       type: string
 *                       example: "#3B82F6"
 *                     placeholder:
 *                       type: string
 *                       example: Ask anything...
 *                 session:
 *                   type: object
 *                   properties:
 *                     visitorId:
 *                       type: string
 *                       example: vis_01h8abc222xyz
 *                     activeConversationId:
 *                       type: string
 *                       nullable: true
 *                       example: conv_01j9abc789qwe
 *       401:
 *         description: Header execution is missing required x-api-key mappings or token parameters are invalid
 *       403:
 *         description: The requesting browser container origin fails domain whitelist verification rules
 *       500:
 *         description: Internal configuration generation engine error
 */

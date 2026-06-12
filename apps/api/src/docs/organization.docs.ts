/**
 * @swagger
 * tags:
 *   name: Organizations
 *   description: Organization profile management, chat widget configurations, and core knowledge base operations
 */

/**
 * @swagger
 * /api/v1/organizations/me:
 *   get:
 *     summary: Retrieve current organization details
 *     description: Fetches the profile and live chat widget configurations for the authenticated user's organization context.
 *     tags: [Organizations]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Organization payload and configuration data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: org_01h7abc123xyz
 *                 name:
 *                   type: string
 *                   example: Acme Corporation
 *                 email:
 *                   type: string
 *                   example: billing@acme.com
 *                 widgetConfig:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: Support Nest Chat
 *                     greetingMessage:
 *                       type: string
 *                       example: Hi there! How can we help you today?
 *                     accentColor:
 *                       type: string
 *                       example: "#3B82F6"
 *                     placeholder:
 *                       type: string
 *                       example: Type your message here...
 *       401:
 *         description: Unauthorized session context
 *       500:
 *         description: Internal server error
 *   patch:
 *     summary: Update organization profile
 *     description: Updates core identity metadata fields (name, primary communication email) for the authenticated organization context.
 *     tags: [Organizations]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Acme Corporation New
 *               email:
 *                 type: string
 *                 format: email
 *                 example: operations@acme.com
 *     responses:
 *       200:
 *         description: Organization profile data successfully modified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: org_01h7abc123xyz
 *                 name:
 *                   type: string
 *                   example: Acme Corporation New
 *                 email:
 *                   type: string
 *                   example: operations@acme.com
 *       400:
 *         description: Invalid or unparseable input parameters
 *       401:
 *         description: Unauthorized session context
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/organizations/widget-config:
 *   patch:
 *     summary: Update chat widget appearance
 *     description: Updates styling properties and text definitions for the embedded front-end customer support widget.
 *     tags: [Organizations]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Chat with Acme Support
 *               greetingMessage:
 *                 type: string
 *                 example: Hello! Tell us what you need.
 *               accentColor:
 *                 type: string
 *                 example: "#EF4444"
 *               placeholder:
 *                 type: string
 *                 example: Describe your problem...
 *     responses:
 *       200:
 *         description: Front-end widget template configuration modified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 widgetConfig:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: Chat with Acme Support
 *                     greetingMessage:
 *                       type: string
 *                       example: Hello! Tell us what you need.
 *                     accentColor:
 *                       type: string
 *                       example: "#EF4444"
 *                     placeholder:
 *                       type: string
 *                       example: Describe your problem...
 *       401:
 *         description: Unauthorized session context
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/organizations/{orgId}/knowledge:
 *   post:
 *     summary: Upload a knowledge base document file
 *     description: Accepts a single document file payload (via multipart/form-data), uploads the binary to cloud storage, and registers a database item to trigger the chunking pipeline.
 *     tags: [Organizations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique structural target organization identity locator
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - title
 *               - type
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file content block (e.g., PDF, DOCX)
 *               title:
 *                 type: string
 *                 example: Company Return Policy 2026
 *               type:
 *                 type: string
 *                 enum: [PDF, DOC, API_DOC, SWAGGER_URL]
 *                 example: PDF
 *     responses:
 *       202:
 *         description: Binary file accepted and processing pipeline worker queued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 documentId:
 *                   type: string
 *                   example: doc_01j9xyz777abc
 *                 status:
 *                   type: string
 *                   example: PROCESSING
 *       400:
 *         description: No file attached, or pre-requisite business API config missing for technical document types
 *       401:
 *         description: Unauthorized session context
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: List organization knowledge base documents
 *     description: Returns a filterable, paginated index of all knowledge base files belonging to the target organization parameter.
 *     tags: [Organizations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique structural target organization identity locator
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Zero-indexed structural pagination index sequence value
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Document item result batch capacity count boundary
 *     responses:
 *       200:
 *         description: Document array registry records returned successfully
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
 *                   example: documents fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: doc_01j9xyz777abc
 *                           title:
 *                             type: string
 *                             example: Company Return Policy 2026
 *                           type:
 *                             type: string
 *                             example: PDF
 *                           storagePath:
 *                             type: string
 *                             example: https://res.cloudinary.com/supportnest/raw/upload/v1/doc.pdf
 *                           status:
 *                             type: string
 *                             example: PROCESSING
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: 2026-06-12T03:34:10.000Z
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *       404:
 *         description: Targeted organization identifier context does not exist
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/organizations/{orgId}/knowledge/{docId}:
 *   delete:
 *     summary: Delete a knowledge base document
 *     description: Unlinks and deletes the document registry entity records along with its associated vector embeddings and tokenized chunk data.
 *     tags: [Organizations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique structural target organization identity locator
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique document configuration item context record identifier
 *     responses:
 *       200:
 *         description: Document data elements and structural search indices wiped successfully
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
 *                   example: Document deleted successfully
 *       400:
 *         description: Invalid deletion parameters or requested target organization context is inactive
 *       404:
 *         description: Document not found under organization context
 *       500:
 *         description: Internal server error
 */

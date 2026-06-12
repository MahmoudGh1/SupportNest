/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Support ticket lifecycle management and human agent escalation routing
 */

/**
 * @swagger
 * /api/v1/tickets:
 *   post:
 *     summary: Create a support ticket
 *     description: Escalates a conversation session into a formal support ticket. Triggered automatically by AI Tier-2 routing layers or manually by an agent.
 *     tags: [Tickets]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *             properties:
 *               conversationId:
 *                 type: string
 *                 example: clvk123450000jk8s9zxxb8a1
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 example: HIGH
 *     responses:
 *       201:
 *         description: Ticket successfully spawned and live session escalated
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
 *                   example: Ticket created and conversation escalated.
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: tkt_01h8abc111xyz
 *                         conversationId:
 *                           type: string
 *                           example: clvk123450000jk8s9zxxb8a1
 *                         status:
 *                           type: string
 *                           example: OPEN
 *                         priority:
 *                           type: string
 *                           example: HIGH
 *       400:
 *         description: Missing conversation identifier target
 *       401:
 *         description: Unauthorized session context
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: List filterable tickets
 *     description: Compiles a filterable, paginated registry of all escalation tickets linked to the caller's organization context.
 *     tags: [Tickets]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED]
 *         description: Filter tickets by lifecycle phase state
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         description: Filter tickets by importance rank
 *       - in: query
 *         name: assignedToId
 *         schema:
 *           type: string
 *         description: Filter by specific handling human agent ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Target page offset index value
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Max items returning per page batch boundary
 *     responses:
 *       200:
 *         description: Filtered organizational ticket array loaded successfully
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
 *                   example: Tickets fetched successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     tickets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: tkt_01h8abc111xyz
 *                           status:
 *                             type: string
 *                             example: OPEN
 *                           priority:
 *                             type: string
 *                             example: HIGH
 *                           assignedToId:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 42
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *       401:
 *         description: Unauthorized session context
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/tickets/{id}:
 *   get:
 *     summary: Get a single ticket by ID
 *     description: Fetches isolated metadata and structural properties matching a targeted ticket item locator.
 *     tags: [Tickets]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique database identifier of the support ticket
 *     responses:
 *       200:
 *         description: Support ticket data structure retrieved cleanly
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
 *                   example: Ticket fetched successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: tkt_01h8abc111xyz
 *                         organizationId:
 *                           type: string
 *                           example: org_01h7abc123xyz
 *                         conversationId:
 *                           type: string
 *                           example: clvk123450000jk8s9zxxb8a1
 *                         status:
 *                           type: string
 *                           example: OPEN
 *                         priority:
 *                           type: string
 *                           example: HIGH
 *       401:
 *         description: Unauthorized session context
 *       404:
 *         description: Ticket not found under organizational boundary
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/tickets/{id}/assign:
 *   patch:
 *     summary: Assign ticket to an agent
 *     description: Allocates handling responsibilities of an active ticket entity explicitly to an internal human helpdesk agent.
 *     tags: [Tickets]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique database identifier of the support ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignedToId
 *             properties:
 *               assignedToId:
 *                 type: string
 *                 example: usr_01h7abc123xyz
 *     responses:
 *       200:
 *         description: Assignment parameter applied and persisted successfully
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
 *                   example: Ticket assigned successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: tkt_01h8abc111xyz
 *                         assignedToId:
 *                           type: string
 *                           example: usr_01h7abc123xyz
 *       400:
 *         description: Missing target agent variable identifier values
 *       401:
 *         description: Unauthorized session context
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/tickets/{id}/start:
 *   patch:
 *     summary: Mark ticket as in progress
 *     description: Advances the ticket state timeline from OPEN to IN_PROGRESS. Automatically claims ownership for the caller if unassigned.
 *     tags: [Tickets]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique database identifier of the support ticket
 *     responses:
 *       200:
 *         description: Ticket shifted to active triage phase successfully
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
 *                   example: Ticket marked as in progress.
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: tkt_01h8abc111xyz
 *                         status:
 *                           type: string
 *                           example: IN_PROGRESS
 *                         assignedToId:
 *                           type: string
 *                           example: usr_calling_agent_999
 *       401:
 *         description: Unauthorized session context
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/tickets/{id}/resolve:
 *   patch:
 *     summary: Resolve a ticket
 *     description: Closes the active ticket life span and assigns closing resolution summary logs into history indexes.
 *     tags: [Tickets]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique database identifier of the support ticket
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolutionNote:
 *                 type: string
 *                 example: Fixed tracking reference inconsistencies directly within internal billing systems.
 *     responses:
 *       200:
 *         description: Ticket workflow resolved successfully
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
 *                   example: Ticket resolved successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: tkt_01h8abc111xyz
 *                         status:
 *                           type: string
 *                           example: RESOLVED
 *                         resolutionNote:
 *                           type: string
 *                           example: Fixed tracking reference inconsistencies directly within internal billing systems.
 *       401:
 *         description: Unauthorized session context
 *       500:
 *         description: Internal server error
 */

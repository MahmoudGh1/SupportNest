/**
 * @swagger
 * tags:
 *   name: Team & Invitations
 *   description: Organization team member management and invitation flows
 */

/**
 * @swagger
 * /api/v1/invitations/invite:
 *   post:
 *     summary: Invite a new team member
 *     description: Sends an email invitation to a prospective team member joining the user's organization.
 *     tags: [Team & Invitations]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: member@acme.com
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invitation sent successfully
 *       400:
 *         description: A valid email is required
 *       401:
 *         description: Unauthorized session or missing organization context
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/invitations/team:
 *   get:
 *     summary: Get team members and pending invitations
 *     description: Retrieves a list of all current team members and pending invitations tied to the authenticated user's organization.
 *     tags: [Team & Invitations]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Team details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: usr_01h7abc123xyz
 *                       firstName:
 *                         type: string
 *                         example: Jane
 *                       lastName:
 *                         type: string
 *                         example: Doe
 *                       email:
 *                         type: string
 *                         example: jane@acme.com
 *                 pendingInvitations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: inv_01h7abc456qwe
 *                       email:
 *                         type: string
 *                         example: member@acme.com
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-06-12T03:34:10.000Z
 *       401:
 *         description: Unauthorized session
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/invitations/invitations/{id}:
 *   delete:
 *     summary: Revoke a pending invitation
 *     description: Cancels and removes a pending invitation before it is accepted.
 *     tags: [Team & Invitations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the invitation to revoke
 *     responses:
 *       200:
 *         description: Invitation revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invitation revoked
 *       401:
 *         description: Unauthorized session
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/invitations/accept/{token}:
 *   get:
 *     summary: Validate an invitation token
 *     description: Checks whether an activation token sent via email is still valid, unexpired, and retrieves basic metadata.
 *     tags: [Team & Invitations]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique structural invitation token from email link
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 email:
 *                   type: string
 *                   example: member@acme.com
 *                 organizationName:
 *                   type: string
 *                   example: Acme Inc
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/invitations/accept/{token}:
 *   post:
 *     summary: Accept invitation and complete registration
 *     description: Submits user profiling payload to register a profile tied to the token's issuing organization.
 *     tags: [Team & Invitations]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique structural invitation token from email link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Smith
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: StrongPassword123
 *     responses:
 *       201:
 *         description: Invitation accepted, profile registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: usr_01h7abc789mno
 *                     email:
 *                       type: string
 *                       example: member@acme.com
 *                     organizationId:
 *                       type: string
 *                       example: org_01h7abc123xyz
 *       400:
 *         description: Missing required fields or password too short (< 8 chars)
 *       500:
 *         description: Internal server error
 */
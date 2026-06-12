/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication and session management APIs
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new organization and admin user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - email
 *               - password
 *             properties:
 *               businessName:
 *                 type: string
 *                 example: Acme Inc
 *               email:
 *                 type: string
 *                 example: admin@acme.com
 *               password:
 *                 type: string
 *                 example: StrongPassword123
 *               firstName:
 *                 type: string
 *                 example: Mahmoud
 *               lastName:
 *                 type: string
 *                 example: Gharib
 *               planId:
 *                 type: string
 *                 example: 5f5fc275-de3d-42ea-95b3-de22638874f6
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/auth/register-paid:
 *   post:
 *     summary: Register a user and create a paid subscription
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - email
 *               - password
 *               - planId
 *               - amount
 *             properties:
 *               businessName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               planId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 499
 *               currency:
 *                 type: string
 *                 example: EGP
 *               isAnnual:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Registration completed successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@acme.com
 *               password:
 *                 type: string
 *                 example: StrongPassword123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Subscription inactive
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh cookie
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or missing refresh token
 */

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User logged out successfully
 */

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Invalid session
 */

export {};
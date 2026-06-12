/**
 * @swagger
 * tags:
 *   name: API Keys
 *   description: Manage organization API keys
 */

/**
 * @swagger
 * /api/v1/dashboard/apikey/create:
 *   post:
 *     summary: Create a new API key
 *     description: Creates a new API key for the authenticated organization. The raw secret key is returned only once and should be stored securely.
 *     tags: [API Keys]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allowedOrigins:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - https://example.com
 *                   - https://app.example.com
 *     responses:
 *       201:
 *         description: API key created successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/dashboard/apikey/keys:
 *   get:
 *     summary: List organization API keys
 *     description: Returns all API keys belonging to the authenticated organization.
 *     tags: [API Keys]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/dashboard/apikey/{id}/revoke:
 *   patch:
 *     summary: Revoke an API key
 *     description: Revokes an existing API key belonging to the authenticated organization.
 *     tags: [API Keys]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: API Key ID
 *         example: cmf7j9v3h0001abc123xyz
 *     responses:
 *       200:
 *         description: API key revoked successfully
 *       400:
 *         description: Missing key ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Organization or API key not found
 *       500:
 *         description: Internal server error
 */

export {};

/**
 * @swagger
 * tags:
 *   name: Pricing & Plans
 *   description: Public infrastructure access configurations and subscription corporate plan catalogs
 */

/**
 * @swagger
 * /api/v1/pricing:
 *   get:
 *     summary: List all active subscription plans
 *     description: Public catalog endpoint that compiles available commercial tier pricing definitions, seat allocations, and processing message boundaries.
 *     tags: [Pricing & Plans]
 *     responses:
 *       200:
 *         description: Dynamic membership plan structural limits and configurations loaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: prc_01h8abc123xyz
 *                   name:
 *                     type: string
 *                     example: Growth Tier
 *                   amountMonthly:
 *                     type: integer
 *                     example: 4900
 *                   amountAnnually:
 *                     type: integer
 *                     example: 47000
 *                   currency:
 *                     type: string
 *                     example: EGP
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: Up to 5 custom AI routing agents
 *                   isActive:
 *                     type: boolean
 *                     example: true
 *       500:
 *         description: Internal server error
 */

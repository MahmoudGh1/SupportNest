/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Organization billing integrations, Paymob intent generation, and active checkout webhook lifecycles
 */

/**
 * @swagger
 * /api/v1/payments/webhook:
 *   post:
 *     summary: Paymob transactional webhook processor
 *     description: Core external endpoint consumed exclusively by Paymob to push order lifecycle updates. Employs embedded cryptographically validated HMAC calculations to prevent request forging.
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: hmac
 *         required: true
 *         schema:
 *           type: string
 *         description: Hexadecimal secure authentication hash calculation passed via the dynamic transaction verification callback URL params
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - obj
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 example: TRANSACTION
 *               obj:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 98124572
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   amount_cents:
 *                     type: integer
 *                     example: 150000
 *     responses:
 *       200:
 *         description: Webhook received acknowledgment payload (always returns a 200 variant to suppress upstream provider payment retry storm patterns)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 */

/**
 * @swagger
 * /api/v1/payments/create-intention:
 *   post:
 *     summary: Initiate a corporate plan transaction execution token
 *     description: Handshakes directly with backend integration layers to register pricing tiers and spawn localized checkout tracking properties.
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pricingId
 *               - amountCents
 *               - billingData
 *             properties:
 *               pricingId:
 *                 type: string
 *                 example: prc_01h8abc123xyz
 *               amountCents:
 *                 type: integer
 *                 example: 150000
 *               currency:
 *                 type: string
 *                 default: EGP
 *                 example: EGP
 *               billingData:
 *                 type: object
 *                 required:
 *                   - firstName
 *                   - lastName
 *                   - email
 *                   - phoneNumber
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     example: Aly
 *                   lastName:
 *                     type: string
 *                     example: Osman
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: billing@nest.io
 *                   phoneNumber:
 *                     type: string
 *                     example: "+201012345678"
 *     responses:
 *       201:
 *         description: Financial intent established; client initialization token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentKeys:
 *                   type: string
 *                   example: cs_live_a1b2c3...
 *                 orderId:
 *                   type: string
 *                   example: ord_01j2abc789qwe
 *       400:
 *         description: Missing core billing payload properties or amount configurations
 *       401:
 *         description: Missing target user administrative or authorization properties
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/payments/complete:
 *   post:
 *     summary: Complete synchronous checkout process
 *     description: Finalizes account status alignment and applies active functional variables directly onto corporate plan schemas post-transaction execution.
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pricingId
 *               - amount
 *             properties:
 *               pricingId:
 *                 type: string
 *                 example: prc_01h8abc123xyz
 *               amount:
 *                 type: number
 *                 example: 1500.00
 *               currency:
 *                 type: string
 *                 default: EGP
 *                 example: EGP
 *               isAnnual:
 *                 type: boolean
 *                 default: false
 *                 example: true
 *     responses:
 *       200:
 *         description: Subscription lifecycle limits mutated and updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 activePlan:
 *                   type: string
 *                   example: ENTERPRISE_TIER
 *       400:
 *         description: Missing valid target checkout variables
 *       401:
 *         description: Session token verification failed
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/payments/history:
 *   get:
 *     summary: Fetch organization payment audit trails
 *     description: Compiles sequential transaction references and historical plan receipt details for accounting compliance audits.
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Audit collection items parsed and returned cleanly
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: tx_01h8abc456qwe
 *                   amountCents:
 *                     type: integer
 *                     example: 150000
 *                   currency:
 *                     type: string
 *                     example: EGP
 *                   status:
 *                     type: string
 *                     example: PAID
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: 2026-06-12T03:53:46.000Z
 *       401:
 *         description: Forbidden operational execution parameters
 *       500:
 *         description: Internal server error
 */

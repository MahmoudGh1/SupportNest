/**
 * Admin dashboard route definitions.
 *
 * This router exposes protected admin endpoints for platform overview,
 * organization management, org-scoped metrics, and escalation tracking.
 * All routes require authentication and SUPER_ADMIN authorization.
 */
import { Router } from "express";
import prisma from "../config/prisma.js";
// Controllers
import {
  getOverview,
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  suspendOrganization,
  activateOrganization,
  getOrgTierStats,
  getOrgConversationStats,
  getOrgTicketStats,
  getOrgCsat,
  getOrgEscalations,
  getGlobalTierStats,
  getGlobalEscalations,
  deleteConversation,
  getOrgConversations,
  getConversationById,
  deleteOrganization,
  cancelDeleteOrganization,
} from "../controllers/admin-dashboard/admin.organizations.controller.js";

import {
  getOrgUsers,
  getOrgUser,
  createOrgUser,
  updateOrgUser,
  removeOrgUser,
  getAllUsers,
} from "../controllers/admin-dashboard/admin.users.controller.js";
import { authMiddleware } from "src/middlewares/auth.middleware.js";
import { adminMiddleware } from "src/middlewares/admin.middleware.js";
import { getContactSubmissions } from "../controllers/admin-dashboard/contact.controller.js";
const router: Router = Router();

// All admin routes require authentication
router.use(authMiddleware);
router.use(adminMiddleware("SUPER_ADMIN"));

/**
 * GET /admin/overview
 * Global platform metrics: org counts, conversations, tickets, AI resolution rate, CSAT
 */
router.get("/overview", getOverview);

/**
 * GET /admin/tier-stats
 * Platform-wide tier funnel, latencies, token usage
 * Query: ?from=2026-01-01&to=2026-06-30
 */
router.get("/tier-stats", getGlobalTierStats);

/**
 * GET /admin/escalations
 * All escalated tickets across all orgs, paginated
 * Query: ?priority=high&status=open&from=...&to=...&page=1&limit=20
 */
router.get("/escalations", getGlobalEscalations);

/**
 * GET /admin/organizations
 * List all organizations with stats summary
 * Query: ?search=shopwave&is_active=true&page=1&limit=20
 * Role: SUPER_ADMIN
 */
router.get("/organizations", getOrganizations);

/**
 * POST /admin/organizations
 * Create a new tenant organization
 * Body: { name, email, slug, plan_id?, widget_config? }
 * Role: SUPER_ADMIN
 */
router.post("/organizations", createOrganization);

/**
 * GET /admin/organizations/:orgId
 * Full org detail: info + users + tier stats + conversation stats + ticket stats + CSAT + recent escalations
 * Role: SUPER_ADMIN
 */
router.get("/organizations/:orgId", getOrganization);

/**
 * PATCH /admin/organizations/:orgId
 * Update org fields: name, email, is_active, plan_id, widget_config
 * Role: SUPER_ADMIN
 */
router.patch("/organizations/:orgId", updateOrganization);

router.delete("/organizations/:orgId", deleteOrganization);
router.post("/organizations/:orgId/cancel-delete", cancelDeleteOrganization);
/**
 * PATCH /admin/organizations/:orgId/suspend
 * Suspend org (sets is_active = false)
 * Role: SUPER_ADMIN
 */
router.patch("/organizations/:orgId/suspend", suspendOrganization);

/**
 * PATCH /admin/organizations/:orgId/activate
 * Re-activate a suspended org
 * Role: SUPER_ADMIN
 */
router.patch("/organizations/:orgId/activate", activateOrganization);

/**
 * GET /admin/organizations/:orgId/tier-stats
 * Tier funnel, latencies, token usage for a single org
 * Query: ?from=...&to=...
 */
router.get("/organizations/:orgId/tier-stats", getOrgTierStats);

/**
 * GET /admin/organizations/:orgId/conversation-stats
 * Conversation counts by status + avg resolution & response times
 * Query: ?from=...&to=...
 */
router.get("/organizations/:orgId/conversation-stats", getOrgConversationStats);

router.get("/organizations/:orgId/conversations", getOrgConversations);

router.get(
  "/organizations/:orgId/conversations/:conversationId",
  getConversationById,
);

/**
 * GET /admin/organizations/:orgId/ticket-stats
 * Ticket counts by status + priority breakdown
 * Query: ?from=...&to=...
 */
router.get("/organizations/:orgId/ticket-stats", getOrgTicketStats);

/**
 * GET /admin/organizations/:orgId/csat
 * CSAT average + score distribution
 * Query: ?from=...&to=...
 */
router.get("/organizations/:orgId/csat", getOrgCsat);

/**
 * GET /admin/organizations/:orgId/escalations
 * Paginated escalated tickets for one org
 * Query: ?from=...&to=...&page=1&limit=20
 */
router.get("/organizations/:orgId/escalations", getOrgEscalations);

/**
 * GET /admin/users
 * All users across all orgs (super admin only)
 * Query: ?role=support_agent&is_active=true&search=sara&page=1&limit=20
 */
router.get("/users", getAllUsers);

/**
 * GET /admin/organizations/:orgId/users
 * List all users for a specific org
 * Query: ?role=support_agent&is_active=true&page=1&limit=20
 */
router.get("/organizations/:orgId/users", getOrgUsers);

/**
 * GET /admin/organizations/:orgId/users/:userId
 * Get a single user's profile + assigned open tickets
 */
router.get("/organizations/:orgId/users/:userId", getOrgUser);

/**
 * POST /admin/organizations/:orgId/users
 * Create a new user (org_admin or support_agent) for an org
 * Body: { email, password, first_name, last_name, role }
 */
router.post("/organizations/:orgId/users", createOrgUser);

/**
 * PATCH /admin/organizations/:orgId/users/:userId
 * Update user: name, role, is_active
 * Body: { first_name?, last_name?, role?, is_active? }
 */
router.patch("/organizations/:orgId/users/:userId", updateOrgUser);

/**
 * DELETE /admin/organizations/:orgId/users/:userId
 * Soft-delete user (deactivate + unassign open tickets)
 */
router.delete("/organizations/:orgId/users/:userId", removeOrgUser);

/**
 * DELETE /admin/organizations/:orgId/conversations/:conversationId
 * Hard delete a conversation + all its messages, logs, ticket, CSAT, analytics
 */
router.delete(
  "/organizations/:orgId/conversations/:conversationId",
  deleteConversation,
);

// GET /admin/contact-submissions
router.get("/contact-submissions", getContactSubmissions);
export default router;

import { Router } from "express";

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

const router: Router = Router();

// All admin routes require authentication
router.use(authMiddleware);
router.use(adminMiddleware("SUPER_ADMIN"));

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW  (super admin only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /admin/overview
 * Global platform metrics: org counts, conversations, tickets, AI resolution rate, CSAT
 */
router.get("/overview", getOverview);

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL TIER STATS & ESCALATIONS  (super admin only)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// ORGANIZATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /admin/organizations
 * List all organizations with stats summary
 * Query: ?search=shopwave&is_active=true&page=1&limit=20
 * Role: super_admin
 */
router.get("/organizations", getOrganizations);

/**
 * POST /admin/organizations
 * Create a new tenant organization
 * Body: { name, email, slug, plan_id?, widget_config? }
 * Role: super_admin
 */
router.post("/organizations", createOrganization);

/**
 * GET /admin/organizations/:orgId
 * Full org detail: info + users + tier stats + conversation stats + ticket stats + CSAT + recent escalations
 * Role: super_admin
 */
router.get("/organizations/:orgId", getOrganization);

/**
 * PATCH /admin/organizations/:orgId
 * Update org fields: name, email, is_active, plan_id, widget_config
 * Role: super_admin
 */
router.patch("/organizations/:orgId", updateOrganization);

/**
 * PATCH /admin/organizations/:orgId/suspend
 * Suspend org (sets is_active = false)
 * Role: super_admin
 */
router.patch("/organizations/:orgId/suspend", suspendOrganization);

/**
 * PATCH /admin/organizations/:orgId/activate
 * Re-activate a suspended org
 * Role: super_admin
 */
router.patch("/organizations/:orgId/activate", activateOrganization);

// ─────────────────────────────────────────────────────────────────────────────
// ORG-SCOPED STATS (accessible by super_admin and org_admin of that org)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

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

export default router;

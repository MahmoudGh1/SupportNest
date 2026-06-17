import type { User } from "generated/prisma/browser.js";

const { prisma } = require("../lib/prisma");
const { supabaseAdmin } = require("../lib/supabase");

// Recipient resolution - one place that knows "who gets notified for what"

async function getSuperAdmins() {
  return prisma.user.findMany({
    where: { role: "super_admin", is_active: true },
    select: { id: true },
  });
}

async function getOrgAdmins(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId, role: "org_admin", is_active: true },
    select: { id: true },
  });
}

function dedupe(users: User[]) {
  return [...new Map(users.map((u) => [u.id, u])).values()];
}

const NOTIFICATION_RULES = {
  // super_admin only
  organization_registered: async () => getSuperAdmins(),
  user_added: async () => getSuperAdmins(),
  user_deleted: async () => getSuperAdmins(),
  payment_completed: async () => getSuperAdmins(),
  contact_us_submitted: async () => getSuperAdmins(),

  // both - this is the only place "ticket_escalated and csat also notify
  // super_admin" lives. To switch either of these to a daily digest instead
  // of real-time later, change this one line, nothing else.
  ticket_escalated: async (ctx: any) =>
    dedupe([
      ...(await getOrgAdmins(ctx.organizationId)),
      ...(await getSuperAdmins()),
    ]),
  csat_submitted: async (ctx: any) =>
    dedupe([
      ...(await getOrgAdmins(ctx.organizationId)),
      ...(await getSuperAdmins()),
    ]),

  // org_admin only
  new_customer_first_contact: async (ctx: any) =>
    getOrgAdmins(ctx.organizationId),
  organization_suspended: async (ctx: any) => getOrgAdmins(ctx.organizationId),
  organization_reactivated: async (ctx: any) =>
    getOrgAdmins(ctx.organizationId),
};

// Content templates - one place that knows "what does this event say"

const TEMPLATES = {
  organization_registered: (ctx: any) => ({
    title: "New organization registered",
    body: `${ctx.organization_name} just signed up.`,
    action_url: `/admin/organizations/${ctx.organizationId}`,
  }),
  user_added: (ctx: any) => ({
    title: "New user added",
    body: `${ctx.added_by_name} added a new ${ctx.role} to ${ctx.organization_name}.`,
    action_url: `/admin/organizations/${ctx.organizationId}/users`,
  }),
  user_deleted: (ctx: any) => ({
    title: "User removed",
    body: `${ctx.deleted_by_name} removed a user from ${ctx.organization_name}.`,
    action_url: `/admin/organizations/${ctx.organizationId}/users`,
  }),
  payment_completed: (ctx: any) => ({
    title: "Payment received",
    body: `${ctx.organization_name} completed a payment of ${ctx.amount} ${ctx.currency}.`,
    action_url: `/admin/organizations/${ctx.organizationId}/billing`,
  }),
  contact_us_submitted: (ctx: any) => ({
    title: "New contact form submission",
    body: `${ctx.name} (${ctx.email}) reached out.`,
    action_url: `/admin/contact-submissions/${ctx.contact_submission_id}`,
  }),
  ticket_escalated: (ctx: any) => ({
    title: "Ticket escalated to human",
    body: `A ticket from ${ctx.organization_name} was escalated to a human agent.`,
    action_url: `/tickets/${ctx.ticket_id}`,
  }),
  csat_submitted: (ctx: any) => ({
    title: "New CSAT rating",
    body: `Customer rated ${ctx.score}/5 on a ticket from ${ctx.organization_name}.`,
    action_url: `/tickets/${ctx.ticket_id}`,
  }),
  new_customer_first_contact: (ctx: any) => ({
    title: "New customer started a conversation",
    body: "A new customer reached out through your widget.",
    action_url: `/customers/${ctx.customer_id}`,
  }),
  organization_suspended: () => ({
    title: "Your account was suspended",
    body: "SupportNest has suspended your organization. Contact support for details.",
    action_url: "/billing",
  }),
  organization_reactivated: () => ({
    title: "Your account is active again",
    body: "Your organization's access has been restored.",
    action_url: "/dashboard",
  }),
};

type NotificationType = keyof typeof TEMPLATES;

// processNotification - called by the worker, not directly by routes.
// Writes the notification + fan-out rows, then sends a content-free realtime
// signal per recipient. The signal carries only an id - clients always
// refetch over the authenticated REST API, so there's no RLS gap even though
// auth here is custom JWT rather than Supabase Auth.

async function processNotification(type: NotificationType, ctx: any) {
  const buildContent = TEMPLATES[type];
  const resolveRecipients = NOTIFICATION_RULES[type];
  if (!buildContent || !resolveRecipients) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  const recipients = (await resolveRecipients(ctx)) as User[];
  if (recipients.length === 0) return null;

  const { title, body, action_url } = buildContent(ctx);

  const notification = await prisma.notification.create({
    data: {
      organizationId: ctx.organizationId ?? null,
      type,
      title,
      body,
      action_url,
      metadata: ctx,
      recipients: { create: recipients.map((u) => ({ user_id: u.id })) },
    },
    include: { recipients: true },
  });

  await Promise.all(
    recipients.map((u) =>
      supabaseAdmin
        .channel(`user:${u.id}:notifications`)
        .send({
          type: "broadcast",
          event: "new",
          payload: { notification_id: notification.id },
        }),
    ),
  );

  return notification;
}

module.exports = {
  processNotification,
  getSuperAdmins,
  getOrgAdmins,
  NOTIFICATION_RULES,
};

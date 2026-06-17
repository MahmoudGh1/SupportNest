import type { User } from "generated/prisma/browser.js";
import { createClient } from "@supabase/supabase-js";
import prisma from "src/config/prisma.js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Recipient resolution - one place that knows "who gets notified for what"

type Recipient = Pick<User, "id">;

export async function getSuperAdmins(): Promise<Recipient[]> {
  return prisma.user.findMany({
    where: { role: "SUPER_ADMIN", isActive: true },
    select: { id: true },
  });
}

export async function getOrgAdmins(
  organizationId: string,
): Promise<Recipient[]> {
  return prisma.user.findMany({
    where: { organizationId, role: "ORG_ADMIN", isActive: true },
    select: { id: true },
  });
}

function dedupe(users: Recipient[]) {
  return [...new Map(users.map((u) => [u.id, u])).values()];
}

export const NOTIFICATION_RULES = {
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

export const TEMPLATES = {
  organization_registered: (ctx: any) => ({
    title: "New organization registered",
    body: `${ctx.organizationName} just signed up.`,
    actionUrl: `/dashoard/admin/organizations/${ctx.organizationId}`,
  }),
  user_added: (ctx: any) => ({
    title: "New user added",
    body: `${ctx.added_by_name} added a new ${ctx.role} to ${ctx.organizationName}.`,
    actionUrl: `/dashoard/admin/organizations/${ctx.organizationId}/users`,
  }),
  user_deleted: (ctx: any) => ({
    title: "User removed",
    body: `${ctx.deletedByName} removed a user from ${ctx.organizationName}.`,
    actionUrl: `/dashoard/admin/organizations/${ctx.organizationId}/users`,
  }),
  payment_completed: (ctx: any) => ({
    title: "Payment received",
    body: `${ctx.organizationName} completed a payment of ${ctx.amount} ${ctx.currency}.`,
    actionUrl: `/dashoard/admin/organizations/${ctx.organizationId}/billing`,
  }),
  contact_us_submitted: (ctx: any) => ({
    title: "New contact form submission",
    body: `${ctx.name} (${ctx.email}) reached out.`,
    actionUrl: `/dashoard/admin/contact-submissions/${ctx.contactSubmissionId}`,
  }),
  ticket_escalated: (ctx: any) => ({
    title: "Ticket escalated to human",
    body: `A ticket from ${ctx.organizationName} was escalated to a human agent.`,
    actionUrl: `/tickets/${ctx.ticketId}`,
  }),
  csat_submitted: (ctx: any) => ({
    title: "New CSAT rating",
    body: `Customer rated ${ctx.score}/5 on a ticket from ${ctx.organizationName}.`,
    actionUrl: `/tickets/${ctx.ticketId}`,
  }),
  new_customer_first_contact: (ctx: any) => ({
    title: "New customer started a conversation",
    body: "A new customer reached out through your widget.",
    actionUrl: `/customers/${ctx.customerId}`,
  }),
  organization_suspended: () => ({
    title: "Your account was suspended",
    body: "SupportNest has suspended your organization. Contact support for details.",
    actionUrl: "/billing",
  }),
  organization_reactivated: () => ({
    title: "Your account is active again",
    body: "Your organization's access has been restored.",
    actionUrl: "/dashboard",
  }),
};

type NotificationType = keyof typeof TEMPLATES;

// processNotification - called by the worker, not directly by routes.
// Writes the notification + fan-out rows, then sends a content-free realtime
// signal per recipient. The signal carries only an id - clients always
// refetch over the authenticated REST API, so there's no RLS gap even though
// auth here is custom JWT rather than Supabase Auth.

export async function processNotification(type: NotificationType, ctx: any) {
  const buildContent = TEMPLATES[type];
  const resolveRecipients = NOTIFICATION_RULES[type];
  if (!buildContent || !resolveRecipients) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  const recipients = (await resolveRecipients(ctx)) as User[];
  if (recipients.length === 0) return null;

  const { title, body, actionUrl } = buildContent(ctx);

  const notification = await prisma.notification.create({
    data: {
      organizationId: ctx.organizationId ?? null,
      type,
      title,
      body,
      actionUrl,
      metadata: ctx,
      recipients: {
        create: recipients.map((u) => ({ user: { connect: { id: u.id } } })),
      },
    },
    include: { recipients: true },
  });

  await Promise.all(
    recipients.map((u) =>
      supabaseAdmin.channel(`user:${u.id}:notifications`).send({
        type: "broadcast",
        event: "new",
        payload: { notificationId: notification.id },
      }),
    ),
  );

  return notification;
}

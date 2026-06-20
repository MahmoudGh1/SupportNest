export type NotificationType =
  | "organization_registered"
  | "organization_suspended"
  | "organization_reactivated"
  | "user_added"
  | "user_deleted"
  | "payment_completed"
  | "ticket_escalated"
  | "csat_submitted"
  | "contact_us_submitted"
  | "new_customer_first_contact";

export interface Notification {
  id: string;
  organizationId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationRecipient {
  id: string;
  notificationId: string;
  userId: string;
  readAt: string | null;
  createdAt: string;
  notification: Notification;
}

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
  organization_id: string | null;
  type: NotificationType;
  title: string;
  body: string;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface NotificationRecipient {
  id: string;
  notification_id: string;
  user_id: string;
  read_at: string | null;
  created_at: string;
  notification: Notification;
}

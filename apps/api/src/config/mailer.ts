import nodemailer from "nodemailer";

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
	throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be set");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

transporter.verify()
  .then(() => console.log("SMTP READY"))
  .catch(err => console.error("SMTP ERROR", err));

export async function sendInvitationEmail(toEmail: string, businessName: string, inviterName: string, token: string): Promise<void> {
	const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

	await transporter.sendMail({
		from: `"SupportNest Team" <${process.env.GMAIL_USER}>`,
		to: toEmail,
		subject: `Invitation to join ${businessName} on SupportNest`,
		text: `Hello, ${inviterName} has invited you to join ${businessName} on SupportNest. Accept the invitation here: ${inviteUrl}`,
		html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-top: 0;">You're invited!</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #374151;">
          <strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong> as a support agent on SupportNest.
        </p>
        <div style="margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This link expires in 7 days and can only be used by this email address.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
      </div>
    `,
	});
}

export async function sendRevocationEmail(toEmail: string, businessName: string): Promise<void> {
	await transporter.sendMail({
		from: `"SupportNest Team" <${process.env.GMAIL_USER}>`,
		to: toEmail,
		subject: `Invitation update for ${businessName}`,
		text: `Your invitation to join ${businessName} on SupportNest has been cancelled by the organization admin.`,
		html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #374151; margin-top: 0;">Invitation Cancelled</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #374151;">
          Your invitation to join <strong>${businessName}</strong> on SupportNest has been cancelled by the organization admin.
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">If you believe this was a mistake, please contact the organization directly.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">SupportNest Platform Notification</p>
      </div>
    `,
	});
}

export async function sendPendingDeletionEmail(toEmail: string, businessName: string, deletionTime: string): Promise<void> {
	await transporter.sendMail({
		from: `"SupportNest Security" <${process.env.GMAIL_USER}>`,
		to: toEmail,
		subject: `[Action Required] Scheduled Deletion of ${businessName}`,
		text: `Important: Your organization "${businessName}" is scheduled for deletion on ${deletionTime}. Contact support immediately if this is an error.`,
		html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fecaca; border-radius: 8px;">
        <h2 style="color: #dc2626; margin-top: 0;">Scheduled Deletion Notice</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #374151;">
          This is an official notice that your organization <strong>${businessName}</strong> is scheduled for permanent deletion.
        </p>
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444; margin: 20px 0;">
          <p style="margin: 0; font-weight: 600; color: #991b1b;">Deletion Scheduled For:</p>
          <p style="margin: 5px 0 0; color: #b91c1c; font-size: 18px;">${deletionTime}</p>
        </div>
        <p style="color: #374151; line-height: 1.5;">
          <strong>Warning:</strong> Deletion is permanent. All users, conversations, documents, and settings will be lost and <strong>cannot be recovered</strong>.
        </p>
        <p style="margin-top: 24px; color: #4b5563; font-size: 14px;">If you believe this is an error or wish to stop this process, please contact a Platform Administrator immediately.</p>
        <hr style="border: 0; border-top: 1px solid #fecaca; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">SupportNest Security Alert</p>
      </div>
    `,
	});
}

export async function sendDeletionCancelledEmail(toEmail: string, businessName: string): Promise<void> {
	await transporter.sendMail({
		from: `"SupportNest Security" <${process.env.GMAIL_USER}>`,
		to: toEmail,
		subject: `Deletion Cancelled: ${businessName} is Active`,
		text: `The scheduled deletion of your organization "${businessName}" has been cancelled. Your data remains safe and accessible.`,
		html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d1fae5; border-radius: 8px;">
        <h2 style="color: #059669; margin-top: 0;">Deletion Cancelled</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #374151;">
          The scheduled deletion of your organization <strong>${businessName}</strong> has been <strong>successfully cancelled</strong>.
        </p>
        <p style="color: #374151; line-height: 1.5;">
          Your organization and all its data remain active and accessible. No further action is required.
        </p>
        <p style="margin-top: 24px; color: #4b5563; font-size: 14px;">If you have any questions regarding your account status, please reach out to our support team.</p>
        <hr style="border: 0; border-top: 1px solid #d1fae5; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">SupportNest Account Security Update</p>
      </div>
    `,
	});
}

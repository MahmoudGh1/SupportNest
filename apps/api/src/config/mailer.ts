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

	console.log("BEFORE SEND");
	await transporter.sendMail({
		from: `"SupportNest" <${process.env.GMAIL_USER}>`,
		to: toEmail,
		subject: `You've been invited to join ${businessName} on SupportNest`,
		html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>You're invited!</h2>
        <p><strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong> as a support agent on SupportNest.</p>
        <a href="${inviteUrl}" style="display:inline-block; padding: 12px 24px; background:#6366f1; color:white; border-radius:6px; text-decoration:none; margin: 16px 0;">
          Accept Invitation
        </a>
        <p style="color:#6b7280; font-size:14px;">This link expires in 7 days and can only be used by this email address.</p>
        <p style="color:#6b7280; font-size:14px;">If you didn't expect this invitation, you can ignore this email.</p>
      </div>
    `,
	});
	console.log("AFTER SEND");
}

export async function sendRevocationEmail(toEmail: string, businessName: string): Promise<void> {
	console.log("BEFORE SEND REVOKE");
	await transporter.sendMail({
		from: `"SupportNest" <${process.env.GMAIL_USER}>`,
		to: toEmail,
		subject: `Your invitation to join ${businessName} has been cancelled`,
		html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Invitation Cancelled</h2>
            <p>Your invitation to join <strong>${businessName}</strong> on SupportNest has been cancelled by the organization admin.</p>
            <p style="color:#6b7280; font-size:14px;">If you believe this was a mistake, please contact the organization directly.</p>
          </div>
        `,
	});
	console.log("AFTER SEND REVOKE");
}

export async function sendPendingDeletionEmail(toEmail: string, businessName: string, deletionTime: string): Promise<void> {
	await transporter.sendMail({
		from: `"SupportNest" <${process.env.GMAIL_USER}>`,
		to: toEmail,
		subject: `Notice: Your organization "${businessName}" is scheduled for deletion`,
		html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Scheduled Deletion Notice</h2>
        <p>This is to inform you that your organization <strong>${businessName}</strong> has been scheduled for permanent deletion by a Platform Administrator.</p>
        <p>The deletion will occur on <strong>${deletionTime}</strong> (approximately 30 minutes from now).</p>
        <p><strong>Warning:</strong> Once deleted, all your data, including users, conversations, and configuration, will be permanently lost and cannot be recovered.</p>
        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">If you believe this is an error, please contact support immediately.</p>
      </div>
    `,
	});
}

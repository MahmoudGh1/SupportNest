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

transporter
	.verify()
	.then(() => console.log("SMTP READY"))
	.catch((err) => console.error("SMTP ERROR", err));

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

export async function sendVerificationEmail(toEmail: string, code: string): Promise<void> {
	try {
		await transporter.sendMail({
			from: `"SupportNest" <${process.env.GMAIL_USER}>`,
			to: toEmail,
			subject: `Your SupportNest verification code: ${code}`,
			html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2>Verify your email</h2>
              <p>Enter this code to verify your email address. It expires in <strong>10 minutes</strong>.</p>
              <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; 
                          background: #f4f4f5; padding: 24px; border-radius: 8px; 
                          text-align: center; margin: 24px 0; color: #534AB7;">
                ${code}
              </div>
              <p style="color:#6b7280; font-size:14px;">If you didn't request this, you can ignore this email.</p>
            </div>
          `,
		});
	} catch (err) {
		console.log("Failed to send verification email: ", err);
		throw err;
	}
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string): Promise<void> {
	await transporter.sendMail({
		from: `"SupportNest" <${process.env.GMAIL_USER}>`,
		to: toEmail,
		subject: "Reset your SupportNest password",
		html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>We received a request to reset your password. Click the button below to choose a new one.</p>
            <a href="${resetUrl}" style="display:inline-block; padding: 12px 24px; background:#6366f1; color:white; border-radius:6px; text-decoration:none; margin: 16px 0;">
              Reset Password
            </a>
            <p style="color:#6b7280; font-size:14px;">This link expires in 1 hour and can only be used once.</p>
            <p style="color:#6b7280; font-size:14px;">If you didn't request a password reset, you can ignore this email.</p>
          </div>
        `,
	});
}

export async function sendAgentRemovalScheduledEmail(toEmail: string, agentFirstName: string, orgName: string, removalAt: Date): Promise<void> {
	await transporter.sendMail({
		from: `"SupportNest Admin" <${process.env.GMAIL_USER}>`,
		to: toEmail,
		subject: `Your access to ${orgName} on SupportNest will be removed`,
		html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #c0392b; margin-bottom: 16px;">Account Removal Scheduled</h2>
        <p>Hi <strong>${agentFirstName}</strong>,</p>
        <p>An administrator has scheduled the removal of your support agent access to <strong>${orgName}</strong> on SupportNest.</p>
        <div style="background-color: #fff5f5; border-left: 4px solid #c0392b; border-radius: 4px; padding: 12px 16px; margin: 20px 0;">
          <p style="margin: 0; color: #c0392b; font-weight: 600;">Removal time: ${removalAt.toUTCString()}</p>
        </div>
        <p>If you believe this is a mistake, please contact your organization administrator before the removal time.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">SupportNest · AI-Powered Support</p>
      </div>
    `,
	});
}

export async function sendAgentRemovalCancelledEmail(toEmail: string, agentFirstName: string, orgName: string): Promise<void> {
	await transporter.sendMail({
		from: `"SupportNest Admin" <${process.env.GMAIL_USER}>`,
		to: toEmail,
		subject: `Your access to ${orgName} on SupportNest has been restored`,
		html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #1D9E75; margin-bottom: 16px;">Removal Cancelled</h2>
        <p>Hi <strong>${agentFirstName}</strong>,</p>
        <p>Good news — the scheduled removal of your access to <strong>${orgName}</strong> has been cancelled by an administrator.</p>
        <p>Your account remains active with no changes.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">SupportNest · AI-Powered Support</p>
      </div>
    `,
	});
}

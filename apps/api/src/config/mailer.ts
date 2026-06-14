import nodemailer from "nodemailer";

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
	throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be set");
}

export const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.GMAIL_USER,
		pass: process.env.GMAIL_APP_PASSWORD,
	},
	tls: {
		rejectUnauthorized: false,
	},
});

const emailTimeout = 30000;

function sendEmailWithTimeout(mailOptions: nodemailer.SendMailOptions, timeoutMs: number): Promise<void> {
	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new Error("Email sending timed out"));
		}, timeoutMs);

		transporter.sendMail(mailOptions, (error, info) => {
			clearTimeout(timeoutId);
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
}

export async function sendInvitationEmail(toEmail: string, businessName: string, inviterName: string, token: string): Promise<void> {
	const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

	const mailOptions: nodemailer.SendMailOptions = {
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
	};

	await sendEmailWithTimeout(mailOptions, emailTimeout);
}

export async function sendRevocationEmail(toEmail: string, businessName: string): Promise<void> {
	const mailOptions: nodemailer.SendMailOptions = {
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
	};

	await sendEmailWithTimeout(mailOptions, emailTimeout);
}

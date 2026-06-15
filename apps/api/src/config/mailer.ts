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

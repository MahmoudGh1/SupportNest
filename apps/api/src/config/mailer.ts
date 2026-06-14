import * as Brevo from "@getbrevo/brevo";

if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY must be set");
}

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

export async function sendInvitationEmail(
    toEmail: string,
    businessName: string,
    inviterName: string,
    token: string
): Promise<void> {
    const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = `You've been invited to join ${businessName} on SupportNest`;
    sendSmtpEmail.to = [{ email: toEmail }];
    sendSmtpEmail.sender = { name: "SupportNest", email: process.env.BREVO_SENDER_EMAIL! };
    sendSmtpEmail.htmlContent = `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>You're invited!</h2>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong> as a support agent on SupportNest.</p>
            <a href="${inviteUrl}" style="display:inline-block; padding: 12px 24px; background:#6366f1; color:white; border-radius:6px; text-decoration:none; margin: 16px 0;">
                Accept Invitation
            </a>
            <p style="color:#6b7280; font-size:14px;">This link expires in 7 days and can only be used by this email address.</p>
            <p style="color:#6b7280; font-size:14px;">If you didn't expect this invitation, you can ignore this email.</p>
        </div>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
}

export async function sendRevocationEmail(
    toEmail: string,
    businessName: string
): Promise<void> {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = `Your invitation to join ${businessName} has been cancelled`;
    sendSmtpEmail.to = [{ email: toEmail }];
    sendSmtpEmail.sender = { name: "SupportNest", email: process.env.BREVO_SENDER_EMAIL! };
    sendSmtpEmail.htmlContent = `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Invitation Cancelled</h2>
            <p>Your invitation to join <strong>${businessName}</strong> on SupportNest has been cancelled by the organization admin.</p>
            <p style="color:#6b7280; font-size:14px;">If you believe this was a mistake, please contact the organization directly.</p>
        </div>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
}

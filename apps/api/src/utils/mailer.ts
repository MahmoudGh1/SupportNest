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
});

transporter
  .verify()
  .then(() => console.log("SMTP READY"))
  .catch((err) => console.error("SMTP ERROR", err));

export async function sendOrgDeletionScheduledEmail(
  orgEmail: string,
  orgName: string,
  deletionAt: Date,
): Promise<void> {
  await transporter.sendMail({
    from: `"SupportNest Admin" <${process.env.SMTP_USER}>`,
    to: orgEmail,
    subject: "Your SupportNest account is scheduled for deletion",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">

        <h2 style="color: #c0392b; margin-bottom: 16px;">Account Deletion Scheduled</h2>

        <p>Hi <strong>${orgName}</strong>,</p>

        <p>
          Your SupportNest organization account has been scheduled for deletion.
        </p>

        <!-- Deletion time highlight box -->
        <div style="
          background-color: #fff5f5;
          border-left: 4px solid #c0392b;
          border-radius: 4px;
          padding: 12px 16px;
          margin: 20px 0;
        ">
          <p style="margin: 0; color: #c0392b; font-weight: 600;">
            Deletion time: ${deletionAt.toUTCString()}
          </p>
        </div>

        <p>
          If you believe this was a mistake, please contact us immediately
          before the deletion time and we will cancel it for you.
        </p>

        <!-- Contact Us Button -->
        <div style="text-align: center; margin: 32px 0;">
          
            <a href="mailto:support@supportnest.io"
            style="
              background-color: #c0392b;
              color: #ffffff;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
              display: inline-block;
            "
          >
            Contact Us Immediately
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          SupportNest · AI-Powered Support
        </p>

      </div>
    `,
  });
}

export async function sendOrgDeletionCancelledEmail(
  orgEmail: string,
  orgName: string,
): Promise<void> {
  await transporter.sendMail({
    from: `"SupportNest Admin" <${process.env.SMTP_USER}>`,
    to: orgEmail,
    subject: "Your SupportNest account deletion has been cancelled",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
        
        <h2 style="color: #1D9E75; margin-bottom: 16px;">Account Deletion Cancelled</h2>
        
        <p>Hi <strong>${orgName}</strong>,</p>
        
        <p>
          Good news! The scheduled deletion of your SupportNest organization
          account has been cancelled by an administrator.
        </p>
        
        <p>Your account and all your data are safe and remain active.</p>
        
        <p>If you have any questions or concerns, our support team is ready to help.</p>

        <!-- Contact Us Button -->
        <div style="text-align: center; margin: 32px 0;">
          
            <a href="mailto:support@supportnest.io"
            style="
              background-color: #1D9E75;
              color: #ffffff;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
              display: inline-block;
            "
          >
            Contact Us
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          SupportNest · AI-Powered Support
        </p>

      </div>
    `,
  });
}

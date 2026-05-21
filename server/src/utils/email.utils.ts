import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  await getResend().emails.send({
    from: "ShiftEasy <onboarding@resend.dev>",
    to,
    subject: "Reset your ShiftEasy password",
    html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f7; padding: 40px 16px;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
            <div style="background-color: #0a84ff; padding: 32px 40px;">
                <p style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">ShiftEasy</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.75);">Construction time tracking</p>
            </div>
            <div style="padding: 40px;">
                <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #1c1c1e;">Reset your password</h1>
                <p style="margin: 0 0 28px; font-size: 14px; color: #6e6e73; line-height: 1.6;">
                    We received a request to reset your password. Click the button below to choose a new one.
                </p>
                <a href="${resetLink}" style="display: block; background-color: #0a84ff; color: #ffffff; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 12px; font-size: 15px; font-weight: 600; margin-bottom: 28px;">
                    Reset password
                </a>
                <div style="background-color: #fff9ed; border: 1px solid #ffd60a33; border-radius: 10px; padding: 14px 16px; margin-bottom: 28px;">
                    <p style="margin: 0; font-size: 13px; color: #b45309;">
                        ⏱ This link expires in <strong>15 minutes</strong>.
                    </p>
                </div>
                <p style="margin: 0; font-size: 13px; color: #aeaeb2; line-height: 1.6;">
                    If you didn't request a password reset, you can safely ignore this email.
                </p>
            </div>
            <div style="border-top: 1px solid #f2f2f7; padding: 20px 40px;">
                <p style="margin: 0; font-size: 12px; color: #aeaeb2; text-align: center;">ShiftEasy — Built for construction teams</p>
            </div>
        </div>
    </div>
    `,
  });
};

export const sendInviteEmail = async (to: string, name: string, inviteLink: string) => {
  await getResend().emails.send({
    from: "ShiftEasy <onboarding@resend.dev>",
    to,
    subject: "You've been invited to ShiftEasy",
    html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f7; padding: 40px 16px;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
            <div style="background-color: #0a84ff; padding: 32px 40px;">
                <p style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">ShiftEasy</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.75);">Construction time tracking</p>
            </div>
            <div style="padding: 40px;">
                <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #1c1c1e;">Hi ${name} 👋</h1>
                <p style="margin: 0 0 28px; font-size: 14px; color: #6e6e73; line-height: 1.6;">
                    Your manager has added you to ShiftEasy. Click below to set your password and activate your account.
                </p>
                <a href="${inviteLink}" style="display: block; background-color: #0a84ff; color: #ffffff; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 12px; font-size: 15px; font-weight: 600; margin-bottom: 28px;">
                    Activate account
                </a>
                <div style="background-color: #fff9ed; border: 1px solid #ffd60a33; border-radius: 10px; padding: 14px 16px; margin-bottom: 28px;">
                    <p style="margin: 0; font-size: 13px; color: #b45309;">
                        ⏱ This link expires in <strong>24 hours</strong>.
                    </p>
                </div>
                <p style="margin: 0; font-size: 13px; color: #aeaeb2; line-height: 1.6;">
                    If you weren't expecting this, you can safely ignore this email.
                </p>
            </div>
            <div style="border-top: 1px solid #f2f2f7; padding: 20px 40px;">
                <p style="margin: 0; font-size: 12px; color: #aeaeb2; text-align: center;">ShiftEasy — Built for construction teams</p>
            </div>
        </div>
    </div>
    `,
  });
};

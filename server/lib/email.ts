import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(email: string, code: string) {
    if (!resend) {
        console.log(`[EMAIL SIMULATION] Verification code for ${email}: ${code}`);
        return;
    }

    try {
        await resend.emails.send({
            from: 'EventFold <onboarding@resend.dev>',
            to: email,
            subject: 'Verify your EventFold account',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h1 style="color: #6366f1; text-align: center;">Welcome to EventFold</h1>
                    <p>Thank you for joining the elite standard of album delivery. Please use the following code to verify your account:</p>
                    <div style="background: #f4f4f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #18181b;">${code}</span>
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <p style="color: #71717a; font-size: 12px; text-align: center;">If you didn't create an account, you can safely ignore this email.</p>
                </div>
            `
        });
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error('Failed to send verification email:', error);
        throw new Error('Failed to send verification email');
    }
}

import nodemailer from 'nodemailer';

// Priorities: GMAIL_APP_PASSWORD -> RESEND_API_KEY -> SIMULATION
const GMAIL_EMAIL = process.env.GMAIL_EMAIL || 'eventfoldstudio@gmail.com';
const GMAIL_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function sendVerificationEmail(email: string, code: string) {
    // 1. Try Nodemailer/Gmail (Reliable for free accounts)
    if (GMAIL_PASSWORD) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_EMAIL,
                pass: GMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: `"EventFold" <${GMAIL_EMAIL}>`,
            to: email,
            subject: 'Verify your EventFold account',
            html: verificationTemplate(code),
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`[GMAIL] Verification email sent to ${email}`);
            return;
        } catch (error) {
            console.error('[GMAIL] Failed to send email:', error);
            // Fallback to check other providers
        }
    }

    // 2. Try Resend (If no Gmail password set)
    if (RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(RESEND_API_KEY);
        try {
            await resend.emails.send({
                from: 'EventFold <onboarding@resend.dev>',
                to: email,
                subject: 'Verify your EventFold account',
                html: verificationTemplate(code),
            });
            console.log(`[RESEND] Verification email sent to ${email}`);
            return;
        } catch (error) {
            console.error('[RESEND] Failed to send email:', error);
        }
    }

    // 3. Last Resort: Simulation Mode
    console.log(`[EMAIL SIMULATION] Verification code for ${email}: ${code}`);
}

function verificationTemplate(code: string) {
    return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #6366f1; text-align: center;">Welcome to EventFold</h1>
            <p>Thank you for joining the elite standard of album delivery. Please use the following code to verify your account:</p>
            <div style="background: #f4f4f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #18181b;">${code}</span>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p style="color: #71717a; font-size: 12px; text-align: center;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
    `;
}

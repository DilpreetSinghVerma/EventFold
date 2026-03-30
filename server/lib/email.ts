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

export async function sendSubscriptionReminder(email: string, daysLeft: number, plan: string) {
    if (GMAIL_PASSWORD) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: GMAIL_EMAIL, pass: GMAIL_PASSWORD },
        });

        const mailOptions = {
            from: `"EventFold" <${GMAIL_EMAIL}>`,
            to: email,
            subject: `Action Required: Your EventFold ${plan.toUpperCase()} Access Expires in ${daysLeft} Days`,
            html: reminderTemplate(daysLeft, plan),
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`[GMAIL] Reminder sent to ${email}`);
            return;
        } catch (error) {
            console.error('[GMAIL] Failed to send reminder:', error);
        }
    }
}

export async function sendPasswordResetEmail(email: string, code: string) {
    if (GMAIL_PASSWORD) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: GMAIL_EMAIL, pass: GMAIL_PASSWORD },
        });

        const mailOptions = {
            from: `"EventFold" <${GMAIL_EMAIL}>`,
            to: email,
            subject: 'Reset your EventFold password',
            html: resetTemplate(code),
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`[GMAIL] Password reset email sent to ${email}`);
            return;
        } catch (error) {
            console.error('[GMAIL] Failed to send reset email:', error);
        }
    }

    // Fallback: Simulation
    console.log(`[EMAIL SIMULATION] Password reset code for ${email}: ${code}`);
}


function reminderTemplate(daysLeft: number, plan: string) {
    return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #1e1e2e; border-radius: 24px; background: #030303; color: white;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #8b5cf6; font-size: 32px; margin-bottom: 5px;">EventFold Cinematic</h1>
                <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; color: rgba(255,255,255,0.4);">Elite Platform Access</p>
            </div>
            
            <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
                <p style="font-size: 14px; margin: 0; color: rgba(255,255,255,0.6);">YOUR COLLECTION ACCESS IS EXPIRING</p>
                <h2 style="font-size: 48px; margin: 10px 0; color: white;">${daysLeft} DAYS</h2>
                <p style="font-size: 14px; margin: 0; font-weight: bold; color: #8b5cf6;">${plan.toUpperCase()} UNLIMITED</p>
            </div>

            <p style="line-height: 1.6; color: rgba(255,255,255,0.7); text-align: center;">Your professional cinematic workspace and all shared client albums will move to a limited state in ${daysLeft} days. Renew now to maintain your elite standing and unlimited cloud delivery.</p>
            
            <div style="text-align: center; margin-top: 40px;">
                <a href="https://www.eventfoldstudio.com/dashboard" style="background: #8b5cf6; color: white; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);">RENEW ACCESS NOW</a>
            </div>

            <p style="color: rgba(255,255,255,0.2); font-size: 10px; text-align: center; margin-top: 50px; text-transform: uppercase; letter-spacing: 2px;">Automated Security Notification · Do not reply</p>
        </div>
    `;
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

function resetTemplate(code: string) {
    return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 2px solid #8b5cf6; border-radius: 20px; background: #030303; color: white;">
            <h1 style="color: #8b5cf6; text-align: center; font-size: 28px;">Password Reset</h1>
            <p style="text-align: center; color: rgba(255,255,255,0.6);">You requested a password reset for your EventFold account. Please use the following security code:</p>
            <div style="background: rgba(139, 92, 246, 0.1); padding: 30px; text-align: center; border-radius: 16px; margin: 30px 0; border: 1px solid rgba(139, 92, 246, 0.2);">
                <span style="font-size: 42px; font-weight: bold; letter-spacing: 15px; color: #8b5cf6;">${code}</span>
            </div>
            <p style="text-align: center; color: rgba(255,255,255,0.4); font-size: 12px;">This security code is temporary and will expire in 15 minutes.</p>
            <p style="text-align: center; color: rgba(255,255,255,0.2); font-size: 10px; margin-top: 40px;">If you did not request this, please change your password immediately.</p>
        </div>
    `;
}

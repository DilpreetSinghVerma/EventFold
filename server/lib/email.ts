import nodemailer from 'nodemailer';

// Priorities: GMAIL_APP_PASSWORD -> RESEND_API_KEY -> SIMULATION
const GMAIL_EMAIL = process.env.GMAIL_EMAIL || 'eventfoldstudio@gmail.com';
const GMAIL_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Create shared transporter for Gmail (optimization)
const gmailTransporter = GMAIL_PASSWORD ? nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_EMAIL,
        pass: GMAIL_PASSWORD,
    },
    // Add connection pool for better concurrency
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
}) : null;


export async function sendVerificationEmail(email: string, code: string) {
    let sentVia = '';

    // 1. Try Nodemailer/Gmail (Reliable for free accounts)
    if (gmailTransporter) {
        const mailOptions = {
            from: `"EventFold" <${GMAIL_EMAIL}>`,
            to: email,
            subject: 'Verify your EventFold account',
            html: verificationTemplate(code),
        };

        try {
            await gmailTransporter.sendMail(mailOptions);
            console.log(`[GMAIL] Verification email sent to ${email}`);
            sentVia = 'GMAIL';
        } catch (error) {
            console.error('[GMAIL] Deployment Error / Send Failed:', error);
            // Fallback to check other providers
        }
    }

    // 2. Try Resend (If no Gmail password set or Gmail failed)
    if (!sentVia && RESEND_API_KEY) {
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
            sentVia = 'RESEND';
        } catch (error) {
            console.error('[RESEND] Failed to send email:', error);
        }
    }

    // 3. Last Resort: Simulation Mode
    if (!sentVia) {
        console.log(`[EMAIL SIMULATION] Verification code for ${email}: ${code}`);
    }
}

export async function sendSubscriptionReminder(email: string, daysLeft: number, plan: string) {
    if (gmailTransporter) {
        const mailOptions = {
            from: `"EventFold" <${GMAIL_EMAIL}>`,
            to: email,
            subject: `Action Required: Your EventFold ${plan.toUpperCase()} Access Expires in ${daysLeft} Days`,
            html: reminderTemplate(daysLeft, plan),
        };

        try {
            await gmailTransporter.sendMail(mailOptions);
            console.log(`[GMAIL] Reminder sent to ${email}`);
            return;
        } catch (error) {
            console.error('[GMAIL] Failed to send reminder:', error);
        }
    }
}

export async function sendPasswordResetEmail(email: string, code: string) {
    let sentVia = '';

    if (gmailTransporter) {
        const mailOptions = {
            from: `"EventFold" <${GMAIL_EMAIL}>`,
            to: email,
            subject: 'Reset your EventFold password',
            html: resetTemplate(code),
        };

        try {
            await gmailTransporter.sendMail(mailOptions);
            console.log(`[GMAIL] Password reset email sent to ${email}`);
            sentVia = 'GMAIL';
        } catch (error) {
            console.error('[GMAIL] Failed to send reset email:', error);
        }
    }

    // Fallback: Simulation
    if (!sentVia) {
        console.log(`[EMAIL SIMULATION] Password reset code for ${email}: ${code}`);
    }
}



function reminderTemplate(daysLeft: number, plan: string) {
    return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #1e1e2e; border-radius: 24px; background: #030303; color: white;">
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://eventfoldstudio.com/branding%20material/without%20bg%20version.png" alt="EventFold Logo" style="height: 60px; margin-bottom: 10px; display: inline-block;" />
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

export async function sendAlbumNearExpiryEmail(email: string, albumTitle: string, hoursRemaining: number) {
    if (gmailTransporter) {
        const dashboardUrl = `https://www.eventfoldstudio.com/dashboard`;
        const mailOptions = {
            from: `"EventFold" <${GMAIL_EMAIL}>`,
            to: email,
            subject: `Action Required: Your Free Trial Album "${albumTitle}" Expires in ${hoursRemaining} Hours`,
            html: nearExpiryAlbumTemplate(albumTitle, hoursRemaining, dashboardUrl),
        };

        try {
            await gmailTransporter.sendMail(mailOptions);
            console.log(`[GMAIL] Album Near Expiry email sent to ${email} for "${albumTitle}"`);
            return true;
        } catch (error) {
            console.error('[GMAIL] Failed to send album near-expiry email:', error);
        }
    } else {
        console.log(`[EMAIL SIMULATION] Album Near Expiry reminder for ${email} - Album "${albumTitle}" expires in ${hoursRemaining} hours.`);
    }
    return false;
}

export async function sendAlbumExpiredEmail(email: string, albumTitle: string) {
    if (gmailTransporter) {
        const dashboardUrl = `https://www.eventfoldstudio.com/dashboard`;
        const mailOptions = {
            from: `"EventFold" <${GMAIL_EMAIL}>`,
            to: email,
            subject: `Expired: Your Free Trial Album "${albumTitle}" has Expired`,
            html: expiredAlbumTemplate(albumTitle, dashboardUrl),
        };

        try {
            await gmailTransporter.sendMail(mailOptions);
            console.log(`[GMAIL] Album Expired email sent to ${email} for "${albumTitle}"`);
            return true;
        } catch (error) {
            console.error('[GMAIL] Failed to send album expired email:', error);
        }
    } else {
        console.log(`[EMAIL SIMULATION] Album Expired notification for ${email} - Album "${albumTitle}" has expired.`);
    }
    return false;
}

function nearExpiryAlbumTemplate(albumTitle: string, hoursRemaining: number, dashboardUrl: string) {
    const timeText = hoursRemaining <= 1 ? "1 hour" : `${hoursRemaining} hours`;
    return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #1e1e2e; border-radius: 24px; background: #030303; color: white;">
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://eventfoldstudio.com/branding%20material/without%20bg%20version.png" alt="EventFold Logo" style="height: 60px; margin-bottom: 10px; display: inline-block;" />
                <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; color: rgba(255,255,255,0.4);">Trial Album Expiration</p>
            </div>
            
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
                <p style="font-size: 14px; margin: 0; color: rgba(255,255,255,0.6); text-transform: uppercase;">FREE TRIAL ALBUM EXPIRING SOON</p>
                <h2 style="font-size: 28px; margin: 10px 0; color: #ef4444;">${timeText.toUpperCase()} REMAINING</h2>
                <p style="font-size: 16px; margin: 0; font-weight: bold; color: white;">"${albumTitle}"</p>
            </div>

            <p style="line-height: 1.6; color: rgba(255,255,255,0.7); text-align: center;">Your free 7-day trial album is about to expire. Once expired, client access will be paused and viewers won't be able to flip through the album. Upgrade this album to permanent hosting now to keep it active forever.</p>
            
            <div style="text-align: center; margin-top: 40px;">
                <a href="${dashboardUrl}" style="background: #8b5cf6; color: white; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);">UPGRADE ALBUM NOW</a>
            </div>

            <p style="color: rgba(255,255,255,0.2); font-size: 10px; text-align: center; margin-top: 50px; text-transform: uppercase; letter-spacing: 2px;">Automated Security Notification · Do not reply</p>
        </div>
    `;
}

function expiredAlbumTemplate(albumTitle: string, dashboardUrl: string) {
    return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #1e1e2e; border-radius: 24px; background: #030303; color: white;">
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://eventfoldstudio.com/branding%20material/without%20bg%20version.png" alt="EventFold Logo" style="height: 60px; margin-bottom: 10px; display: inline-block;" />
                <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; color: rgba(255,255,255,0.4);">Trial Album Expired</p>
            </div>
            
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
                <p style="font-size: 14px; margin: 0; color: rgba(255,255,255,0.6); text-transform: uppercase;">FREE TRIAL ALBUM HAS EXPIRED</p>
                <h2 style="font-size: 28px; margin: 10px 0; color: #ef4444;">EXPIRED</h2>
                <p style="font-size: 16px; margin: 0; font-weight: bold; color: white;">"${albumTitle}"</p>
            </div>

            <p style="line-height: 1.6; color: rgba(255,255,255,0.7); text-align: center;">The free trial period for your album has ended. The album has been paused, and viewers can no longer open it. Your files are safe in our grace archive for 30 days. You can restore lifetime hosting and re-enable it immediately by upgrading the album from your dashboard.</p>
            
            <div style="text-align: center; margin-top: 40px;">
                <a href="${dashboardUrl}" style="background: #8b5cf6; color: white; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);">RESTORE & UPGRADE NOW</a>
            </div>

            <p style="color: rgba(255,255,255,0.2); font-size: 10px; text-align: center; margin-top: 50px; text-transform: uppercase; letter-spacing: 2px;">Automated Security Notification · Do not reply</p>
        </div>
    `;
}

export async function sendAlbumPublishedEmail(email: string, albumTitle: string, albumId: string) {
    if (gmailTransporter) {
        const albumUrl = `https://www.eventfoldstudio.com/viewer/${albumId}`;
        const mailOptions = {
            from: `"EventFold" <${GMAIL_EMAIL}>`,
            to: email,
            subject: `Published: Your Cinematic Album "${albumTitle}" is Live!`,
            html: albumPublishedTemplate(albumTitle, albumUrl),
        };

        try {
            await gmailTransporter.sendMail(mailOptions);
            console.log(`[GMAIL] Album Published email sent to ${email} for "${albumTitle}"`);
            return true;
        } catch (error) {
            console.error('[GMAIL] Failed to send album published email:', error);
        }
    } else {
        console.log(`[EMAIL SIMULATION] Album Published notification for ${email} - Album "${albumTitle}" is live. Link: https://www.eventfoldstudio.com/viewer/${albumId}`);
    }
    return false;
}

export async function sendAlbumMilestoneEmail(email: string, albumTitle: string, viewCount: number) {
    if (gmailTransporter) {
        const dashboardUrl = `https://www.eventfoldstudio.com/dashboard`;
        const mailOptions = {
            from: `"EventFold" <${GMAIL_EMAIL}>`,
            to: email,
            subject: `Congratulations! "${albumTitle}" reached ${viewCount} Views!`,
            html: albumMilestoneTemplate(albumTitle, viewCount, dashboardUrl),
        };

        try {
            await gmailTransporter.sendMail(mailOptions);
            console.log(`[GMAIL] Album Milestone email sent to ${email} for "${albumTitle}" (${viewCount} views)`);
            return true;
        } catch (error) {
            console.error('[GMAIL] Failed to send album milestone email:', error);
        }
    } else {
        console.log(`[EMAIL SIMULATION] Album Milestone alert for ${email} - Album "${albumTitle}" reached ${viewCount} views.`);
    }
    return false;
}

function albumPublishedTemplate(albumTitle: string, albumUrl: string) {
    return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #1e1e2e; border-radius: 24px; background: #030303; color: white;">
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://eventfoldstudio.com/branding%20material/without%20bg%20version.png" alt="EventFold Logo" style="height: 60px; margin-bottom: 10px; display: inline-block;" />
                <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; color: rgba(255,255,255,0.4);">Album Successfully Published</p>
            </div>
            
            <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
                <p style="font-size: 14px; margin: 0; color: rgba(255,255,255,0.6);">YOUR ALBUM IS NOW LIVE</p>
                <h2 style="font-size: 24px; margin: 10px 0; color: white;">"${albumTitle}"</h2>
                <p style="font-size: 13px; margin: 0; color: #8b5cf6; font-weight: bold;">SHARE WITH YOUR CLIENTS</p>
            </div>

            <p style="line-height: 1.6; color: rgba(255,255,255,0.7); text-align: center;">Congratulations! Your premium 3D flipbook album has been compiled and is ready for client delivery. Below is your direct viewer link and a scan-ready QR code that you can copy and print on wedding materials or cards.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="margin-bottom: 20px;">
                    <a href="${albumUrl}" style="background: #8b5cf6; color: white; padding: 16px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);">OPEN 3D VIEW ALBUM</a>
                </div>
                <div style="margin-top: 10px; color: rgba(255,255,255,0.4); font-size: 12px; font-family: monospace; word-break: break-all;">
                    ${albumUrl}
                </div>
            </div>

            <div style="text-align: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 30px; border-radius: 20px; margin-top: 30px;">
                <p style="font-size: 12px; font-weight: bold; color: rgba(255,255,255,0.6); margin-top: 0; text-transform: uppercase; letter-spacing: 2px;">Your Shareable QR Code</p>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(albumUrl)}" alt="Album QR Code" style="width: 200px; height: 200px; display: inline-block; margin-top: 10px; border: 4px solid #8b5cf6; border-radius: 16px; background: white; padding: 5px;" />
                <p style="font-size: 10px; color: rgba(255,255,255,0.3); margin-bottom: 0; margin-top: 15px;">Clients scan this QR to open the album instantly on mobile screens.</p>
            </div>

            <p style="color: rgba(255,255,255,0.2); font-size: 10px; text-align: center; margin-top: 50px; text-transform: uppercase; letter-spacing: 2px;">Automated Workspace Notification · Do not reply</p>
        </div>
    `;
}

function albumMilestoneTemplate(albumTitle: string, viewCount: number, dashboardUrl: string) {
    return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #1e1e2e; border-radius: 24px; background: #030303; color: white;">
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://eventfoldstudio.com/branding%20material/without%20bg%20version.png" alt="EventFold Logo" style="height: 60px; margin-bottom: 10px; display: inline-block;" />
                <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; color: rgba(255,255,255,0.4);">Viewer Engagement Milestone</p>
            </div>
            
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
                <p style="font-size: 14px; margin: 0; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">CONGRATULATIONS!</p>
                <h2 style="font-size: 36px; margin: 10px 0; color: #10b981; font-weight: 900;">${viewCount} VIEWS</h2>
                <p style="font-size: 16px; margin: 0; font-weight: bold; color: white;">"${albumTitle}"</p>
            </div>

            <p style="line-height: 1.6; color: rgba(255,255,255,0.7); text-align: center;">Amazing! Your album has reached a new viewer milestone. Clients and families are actively flipping, reviewing, and sharing your cinematic project.</p>
            
            <div style="text-align: center; margin-top: 40px;">
                <a href="${dashboardUrl}" style="background: #10b981; color: white; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);">VIEW REAL-TIME ANALYTICS</a>
            </div>

            <p style="color: rgba(255,255,255,0.2); font-size: 10px; text-align: center; margin-top: 50px; text-transform: uppercase; letter-spacing: 2px;">Automated Analytics Notification · Do not reply</p>
        </div>
    `;
}

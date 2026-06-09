import "dotenv/config";
import { storage } from "../server/storage";
import { sendPromotionalEmail } from "../server/lib/email";

async function main() {
  console.log("Fetching all users from database...");
  const allUsers = await storage.getUsers();
  const emails = Array.from(new Set(allUsers.map(u => u.email.trim().toLowerCase())));
  
  console.log(`Found ${emails.length} unique user email(s) to notify.`);
  
  const subject = "🎁 Earn Free Album Credits: Introducing EventFold's Refer & Earn!";
  const messageHtml = `
    <h2 style="color: #c084fc; margin-bottom: 20px; font-size: 22px; font-weight: bold;">Unlock Free Credits with EventFold Refer & Earn!</h2>
    
    <p style="line-height: 1.8; margin-bottom: 18px;">
      Hello Creator,
    </p>
    
    <p style="line-height: 1.8; margin-bottom: 18px;">
      We are absolutely thrilled to introduce the brand new <b>EventFold Refer & Earn Program</b>! Starting today, you can share the love of cinematic 3D album delivery with other photographers, studios, or print labs, and both of you will earn premium rewards.
    </p>

    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; margin: 25px 0;">
      <h3 style="color: #fbbf24; margin-top: 0; margin-bottom: 15px; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">🏆 Dual-Reward Funnel</h3>
      <ul style="padding-left: 20px; margin: 0; line-height: 1.8;">
        <li style="margin-bottom: 12px;">
          <b style="color: white;">For You (The Referrer):</b> Earn <b>1 Free Album Credit</b> (valued at ₹99) for every 2 friends you refer who sign up and create their first 3D album. There is no limit to how many free credits you can collect!
        </li>
        <li style="margin-bottom: 0;">
          <b style="color: white;">For Your Friends (The Referee):</b> Anyone who joins through your referral link gets <b>1 Free Album Credit</b> (valued at ₹99) automatically as soon as they publish their first 3D album!
        </li>
      </ul>
    </div>

    <h3 style="color: #a78bfa; margin-top: 25px; margin-bottom: 15px; font-size: 16px; font-weight: bold;">🚀 How to Start Earning:</h3>
    <ol style="padding-left: 20px; line-height: 1.8; margin-bottom: 25px;">
      <li style="margin-bottom: 8px;">Log in to your <a href="https://eventfold.vercel.app/dashboard" style="color: #c084fc; text-decoration: underline;">EventFold Dashboard</a>.</li>
      <li style="margin-bottom: 8px;">Look for the shimmering gold <b>REFER & EARN</b> button at the top header and click it.</li>
      <li style="margin-bottom: 8px;">Copy your unique referral link and share it via WhatsApp, Instagram, or Email.</li>
      <li style="margin-bottom: 0;">Track your referral conversions and watch your credits grow in real time!</li>
    </ol>

    <p style="line-height: 1.8; margin-bottom: 18px;">
      To ensure a frictionless experience, we've enabled seamless registration via both <b>Google Sign-In</b> and <b>Personal Email</b>. The referral code will automatically bind to their signup whichever method they choose.
    </p>

    <p style="line-height: 1.8; margin-bottom: 0;">
      Thank you for being an elite partner of EventFold Studio. Let's create and grow together!
    </p>
  `;

  console.log("Starting broadcast queue...");
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    console.log(`[${i + 1}/${emails.length}] Sending to ${email}...`);
    try {
      const success = await sendPromotionalEmail(email, subject, messageHtml);
      if (success) {
        console.log(`Successfully sent to ${email}`);
      } else {
        console.log(`Failed or simulation mode for ${email}`);
      }
    } catch (err) {
      console.error(`Failed to send to ${email}:`, err);
    }
    // 500ms delay to respect SMTP rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.log("Broadcast complete!");
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

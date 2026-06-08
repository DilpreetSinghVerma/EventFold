import fetch from 'node-fetch';

/**
 * Clean and format phone numbers to international standard without '+' prefix
 * e.g., "+91 98765-43210" -> "919876543210"
 * If it's a 10-digit number, prepend "91" (defaulting to India country code)
 */
export function formatWhatsAppNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  return cleaned;
}

export async function sendWhatsAppNotification(toPhone: string, message: string, albumTitle?: string) {
  if (!toPhone) {
    console.log('[WHATSAPP] No phone number provided for notification');
    return;
  }

  const formattedPhone = formatWhatsAppNumber(toPhone);

  // 1. Meta WhatsApp Cloud API
  const metaAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const metaPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (metaAccessToken && metaPhoneNumberId) {
    try {
      const url = `https://graph.facebook.com/v18.0/${metaPhoneNumberId}/messages`;
      const templateName = process.env.WHATSAPP_TEMPLATE_NAME;

      let body: any;

      if (templateName) {
        // Meta API requires templates for business-initiated conversations
        body = {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: albumTitle || 'Your album' },
                  { type: 'text', text: message }
                ]
              }
            ]
          }
        };
      } else {
        // Fallback to text message (only works if user messaged within 24 hours)
        body = {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: message }
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`[META WHATSAPP] Message sent to ${formattedPhone}`);
        return;
      } else {
        console.error('[META WHATSAPP] Failed response:', data);
      }
    } catch (err) {
      console.error('[META WHATSAPP] Error sending message:', err);
    }
  }

  // 2. Twilio WhatsApp API
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER; // e.g. "+14155238886" or "whatsapp:+14155238886"

  if (twilioSid && twilioAuthToken && twilioFrom) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const fromNumber = twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`;
      const toNumber = `whatsapp:+${formattedPhone}`;

      const params = new URLSearchParams();
      params.append('To', toNumber);
      params.append('From', fromNumber);
      params.append('Body', message);

      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`[TWILIO WHATSAPP] Message sent to ${formattedPhone}`);
        return;
      } else {
        console.error('[TWILIO WHATSAPP] Failed response:', data);
      }
    } catch (err) {
      console.error('[TWILIO WHATSAPP] Error sending message:', err);
    }
  }

  // 3. Custom Webhook Mode (Zapier, Make, Wati, Aisensy, etc.)
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formattedPhone,
          message: message,
          albumTitle: albumTitle || 'Your album',
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        console.log(`[CUSTOM WEBHOOK WHATSAPP] Webhook triggered for ${formattedPhone}`);
        return;
      } else {
        console.error(`[CUSTOM WEBHOOK WHATSAPP] Webhook returned status ${res.status}`);
      }
    } catch (err) {
      console.error('[CUSTOM WEBHOOK WHATSAPP] Webhook error:', err);
    }
  }

  // 4. Default: Simulation Mode
  console.log(`\n--- [WHATSAPP SIMULATION] ---`);
  console.log(`To: +${formattedPhone}`);
  console.log(`Message: ${message}`);
  console.log(`-----------------------------\n`);
}

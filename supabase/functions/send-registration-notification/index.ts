// Supabase Edge Function: sends the "you're registered" confirmation over
// email, SMS (Fast2SMS or Twilio), and WhatsApp. Deploy with:
//
//   supabase functions deploy send-registration-notification
//
// Required/optional provider secrets:
//
// 1. Email (Resend):
//   supabase secrets set RESEND_API_KEY=re_... RESEND_FROM="Feastify <onboarding@resend.dev>"
//
// 2. SMS - Option A: India-First (Fast2SMS - works without DLT approval for Indian numbers):
//   supabase secrets set FAST2SMS_API_KEY=your_fast2sms_api_key
//
// 3. SMS - Option B: International / Twilio:
//   supabase secrets set TWILIO_ACCOUNT_SID=AC... TWILIO_AUTH_TOKEN=... TWILIO_SMS_FROM=+1xxxxxxxxxx
//
// 4. WhatsApp (Twilio):
//   supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

interface NotificationPayload {
  event: { id: string; title: string; start_at: string; venue: string; city: string };
  profile: { name: string; email: string; phone: string | null };
  registration: { id: string; status: string };
}

interface ChannelResult {
  channel: "email" | "sms" | "whatsapp";
  status: "sent" | "skipped_not_configured" | "skipped_no_phone" | "failed";
  detail?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

function extractIndianMobile(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return null;
}

function toE164(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^0\d{10}$/.test(cleaned)) return `+91${cleaned.slice(1)}`;
  if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`;
  if (cleaned.startsWith("+")) return cleaned;
  return `+${cleaned}`;
}

async function sendEmail(payload: NotificationPayload): Promise<ChannelResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM") || "Feastify <onboarding@resend.dev>";
  if (!apiKey) return { channel: "email", status: "skipped_not_configured" };

  const { event, profile, registration } = payload;
  const isConfirmed = registration.status === "confirmed";
  const subject = `🎉 ${isConfirmed ? "Confirmed" : "Waitlisted"}: ${event.title} on Feastify`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Feastify Registration Confirmation</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #140f1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #fbf3ea;">
        <div style="max-width: 540px; margin: 0 auto; background: #1e1624; border: 1px solid #3a2c42; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #ff6b47, #b06bff); padding: 28px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #140f1a; letter-spacing: -0.5px;">Feastify</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #140f1a; font-weight: 600;">Campus Events &amp; Hackathons</p>
          </div>
          
          <div style="padding: 28px 24px;">
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #fbf3ea;">Hi <strong>${profile.name}</strong>,</p>
            
            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.5; color: #d4c8db;">
              Your registration for <strong>${event.title}</strong> is 
              <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 13px; text-transform: uppercase; background-color: ${isConfirmed ? '#34d39922' : '#fbbf2422'}; color: ${isConfirmed ? '#34d399' : '#fbbf24'}; border: 1px solid ${isConfirmed ? '#34d39966' : '#fbbf2466'};">
                ${registration.status}
              </span>.
            </p>

            <div style="background: #291d31; border: 1px solid #3a2c42; border-radius: 12px; padding: 18px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #b6a8be; width: 80px;">Date &amp; Time:</td>
                  <td style="padding: 6px 0; color: #fbf3ea; font-weight: 600;">${formatWhen(event.start_at)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #b6a8be;">Venue:</td>
                  <td style="padding: 6px 0; color: #fbf3ea; font-weight: 600;">${event.venue}, ${event.city}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #b6a8be;">Ticket ID:</td>
                  <td style="padding: 6px 0; color: #ff8f6b; font-family: monospace; font-size: 13px;">${registration.id}</td>
                </tr>
              </table>
            </div>

            <p style="margin: 20px 0 24px 0; font-size: 14px; line-height: 1.5; color: #b6a8be;">
              Present your QR code ticket at the entrance during check-in. You can view your ticket anytime in your Feastify dashboard.
            </p>

            <div style="text-align: center; margin: 28px 0 16px 0;">
              <a href="https://feastify.vercel.app/dashboard" style="display: inline-block; background-color: #ff6b47; color: #140f1a; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
                View My Ticket &amp; QR Code &rarr;
              </a>
            </div>
          </div>
          
          <div style="padding: 16px 24px; background: #140f1a; border-top: 1px solid #3a2c42; text-align: center; font-size: 12px; color: #7f6e89;">
            Feastify · Campus Event Registration Platform
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: profile.email, subject, html }),
    });
    if (!res.ok) return { channel: "email", status: "failed", detail: await res.text() };
    return { channel: "email", status: "sent" };
  } catch (e) {
    return { channel: "email", status: "failed", detail: String(e) };
  }
}

async function send2FactorSms(
  phone10Digits: string,
  payload: NotificationPayload,
  apiKey: string,
): Promise<ChannelResult> {
  // Generate a clean 6-digit confirmation / ticket PIN from registration ID
  let pin = payload.registration.id.replace(/\D/g, "").slice(-6);
  if (pin.length < 6) {
    let hash = 0;
    for (let i = 0; i < payload.registration.id.length; i++) {
      hash = ((hash << 5) - hash) + payload.registration.id.charCodeAt(i);
      hash |= 0;
    }
    pin = String(Math.abs(hash) % 900000 + 100000);
  }

  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone10Digits}/${pin}/Feastify`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data.Status !== "Success") {
      return { channel: "sms", status: "failed", detail: JSON.stringify(data) };
    }
    return { channel: "sms", status: "sent" };
  } catch (e) {
    return { channel: "sms", status: "failed", detail: String(e) };
  }
}

async function sendFast2Sms(phone10Digits: string, message: string, apiKey: string): Promise<ChannelResult> {
  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message: message,
        language: "english",
        flash: 0,
        numbers: phone10Digits,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.return === false) {
      const msg = Array.isArray(data.message) ? data.message.join(", ") : (data.message || "Failed to send SMS");
      return { channel: "sms", status: "failed", detail: msg };
    }
    return { channel: "sms", status: "sent" };
  } catch (e) {
    return { channel: "sms", status: "failed", detail: String(e) };
  }
}

async function twilioMessage(
  channel: "sms" | "whatsapp",
  to: string,
  from: string,
  body: string,
): Promise<ChannelResult> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!accountSid || !authToken) return { channel, status: "skipped_not_configured" };

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      },
    );
    if (!res.ok) return { channel, status: "failed", detail: await res.text() };
    return { channel, status: "sent" };
  } catch (e) {
    return { channel, status: "failed", detail: String(e) };
  }
}

async function sendSms(payload: NotificationPayload): Promise<ChannelResult> {
  const rawPhone = payload.profile.phone;
  if (!rawPhone) return { channel: "sms", status: "skipped_no_phone" };

  const { event, registration } = payload;
  const body = `Feastify: You're ${registration.status} for ${event.title} on ${formatWhen(event.start_at)} at ${event.venue}. Ticket ID: ${registration.id}`;
  const indianNumber = extractIndianMobile(rawPhone);

  // 1. Check if 2Factor (India-First SMS) is configured
  const twoFactorKey = Deno.env.get("TWOFACTOR_API_KEY");
  if (twoFactorKey && indianNumber) {
    return send2FactorSms(indianNumber, payload, twoFactorKey);
  }

  // 2. Check if Fast2SMS (India-First SMS) is configured
  const fast2SmsKey = Deno.env.get("FAST2SMS_API_KEY");
  if (fast2SmsKey && indianNumber) {
    return sendFast2Sms(indianNumber, body, fast2SmsKey);
  }

  // 3. Fallback to Twilio SMS if configured
  const twilioFrom = Deno.env.get("TWILIO_SMS_FROM");
  if (twilioFrom) {
    const e164Phone = toE164(rawPhone);
    return twilioMessage("sms", e164Phone, twilioFrom, body);
  }

  return { channel: "sms", status: "skipped_not_configured" };
}

async function sendWhatsApp(payload: NotificationPayload): Promise<ChannelResult> {
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM");
  const rawPhone = payload.profile.phone;
  if (!rawPhone) return { channel: "whatsapp", status: "skipped_no_phone" };
  if (!from) return { channel: "whatsapp", status: "skipped_not_configured" };

  const { event, registration } = payload;
  const e164 = toE164(rawPhone);
  const body = `🎉 You're *${registration.status}* for *${event.title}*\n\n📅 *When*: ${formatWhen(event.start_at)}\n📍 *Venue*: ${event.venue}, ${event.city}\n🎟️ *Ticket ID*: ${registration.id}\n\nShow your QR ticket at the gate from your Feastify dashboard.`;
  return twilioMessage("whatsapp", `whatsapp:${e164}`, from, body);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as NotificationPayload;
    const results = await Promise.all([
      sendEmail(payload),
      sendSms(payload),
      sendWhatsApp(payload),
    ]);

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

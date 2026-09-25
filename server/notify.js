// Registration confirmation over email, SMS, and WhatsApp. This is the former
// Supabase Edge Function (supabase/functions/send-registration-notification),
// now running inside the API server. Every channel is a no-op until its
// provider is configured in .env — nothing is faked.
import { config } from "./config.js";
import { escapeHtml } from "./util.js";

function formatWhen(iso) {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

function extractIndianMobile(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return null;
}

function toE164(phone) {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^0\d{10}$/.test(cleaned)) return `+91${cleaned.slice(1)}`;
  if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`;
  if (cleaned.startsWith("+")) return cleaned;
  return `+${cleaned}`;
}

/** Plain email send through Resend. Returns a ChannelResult-style object. */
export async function sendResendEmail({ to, subject, html }) {
  if (!config.resendApiKey) return { channel: "email", status: "skipped_not_configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: config.resendFrom, to, subject, html }),
    });
    if (!res.ok) return { channel: "email", status: "failed", detail: await res.text() };
    return { channel: "email", status: "sent" };
  } catch (e) {
    return { channel: "email", status: "failed", detail: String(e) };
  }
}

function confirmationHtml({ event, profile, registration }) {
  const isConfirmed = registration.status === "confirmed";
  const badgeBg = isConfirmed ? "#34d39922" : "#fbbf2422";
  const badgeFg = isConfirmed ? "#34d399" : "#fbbf24";
  const badgeBorder = isConfirmed ? "#34d39966" : "#fbbf2466";
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>ShowUp Registration Confirmation</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #140f1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #fbf3ea;">
        <div style="max-width: 540px; margin: 0 auto; background: #1e1624; border: 1px solid #3a2c42; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #ff6b47, #b06bff); padding: 28px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #140f1a; letter-spacing: -0.5px;">ShowUp</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #140f1a; font-weight: 600;">Campus Events &amp; Hackathons</p>
          </div>

          <div style="padding: 28px 24px;">
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #fbf3ea;">Hi <strong>${escapeHtml(profile.name)}</strong>,</p>

            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.5; color: #d4c8db;">
              Your registration for <strong>${escapeHtml(event.title)}</strong> is
              <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 13px; text-transform: uppercase; background-color: ${badgeBg}; color: ${badgeFg}; border: 1px solid ${badgeBorder};">
                ${escapeHtml(registration.status)}
              </span>.
            </p>

            <div style="background: #291d31; border: 1px solid #3a2c42; border-radius: 12px; padding: 18px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #b6a8be; width: 80px;">Date &amp; Time:</td>
                  <td style="padding: 6px 0; color: #fbf3ea; font-weight: 600;">${escapeHtml(formatWhen(event.start_at))}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #b6a8be;">Venue:</td>
                  <td style="padding: 6px 0; color: #fbf3ea; font-weight: 600;">${escapeHtml(event.venue)}, ${escapeHtml(event.city)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #b6a8be;">Ticket ID:</td>
                  <td style="padding: 6px 0; color: #ff8f6b; font-family: monospace; font-size: 13px;">${escapeHtml(registration.id)}</td>
                </tr>
              </table>
            </div>

            <p style="margin: 20px 0 24px 0; font-size: 14px; line-height: 1.5; color: #b6a8be;">
              Present your QR code ticket at the entrance during check-in. You can view your ticket anytime in your ShowUp dashboard.
            </p>

            <div style="text-align: center; margin: 28px 0 16px 0;">
              <a href="${escapeHtml(config.appUrl)}/dashboard" style="display: inline-block; background-color: #ff6b47; color: #140f1a; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
                View My Ticket &amp; QR Code &rarr;
              </a>
            </div>
          </div>

          <div style="padding: 16px 24px; background: #140f1a; border-top: 1px solid #3a2c42; text-align: center; font-size: 12px; color: #7f6e89;">
            ShowUp · Campus Event Registration Platform
          </div>
        </div>
      </body>
    </html>
  `;
}

async function sendEmail(payload) {
  const { event, registration } = payload;
  const isConfirmed = registration.status === "confirmed";
  return sendResendEmail({
    to: payload.profile.email,
    subject: `🎉 ${isConfirmed ? "Confirmed" : "Waitlisted"}: ${event.title} on ShowUp`,
    html: confirmationHtml(payload),
  });
}

async function send2FactorSms(phone10Digits, payload, apiKey) {
  // A 6-digit confirmation PIN derived from the registration id.
  let pin = payload.registration.id.replace(/\D/g, "").slice(-6);
  if (pin.length < 6) {
    let hash = 0;
    for (let i = 0; i < payload.registration.id.length; i++) {
      hash = (hash << 5) - hash + payload.registration.id.charCodeAt(i);
      hash |= 0;
    }
    pin = String((Math.abs(hash) % 900000) + 100000);
  }
  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone10Digits}/${pin}/ShowUp`;
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

async function sendFast2Sms(phone10Digits, message, apiKey) {
  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ route: "q", message, language: "english", flash: 0, numbers: phone10Digits }),
    });
    const data = await res.json();
    if (!res.ok || data.return === false) {
      const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message || "Failed to send SMS";
      return { channel: "sms", status: "failed", detail: msg };
    }
    return { channel: "sms", status: "sent" };
  } catch (e) {
    return { channel: "sms", status: "failed", detail: String(e) };
  }
}

async function twilioMessage(channel, to, from, body) {
  const { twilioAccountSid: sid, twilioAuthToken: token } = config;
  if (!sid || !token) return { channel, status: "skipped_not_configured" };
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    });
    if (!res.ok) return { channel, status: "failed", detail: await res.text() };
    return { channel, status: "sent" };
  } catch (e) {
    return { channel, status: "failed", detail: String(e) };
  }
}

async function sendSms(payload) {
  const rawPhone = payload.profile.phone;
  if (!rawPhone) return { channel: "sms", status: "skipped_no_phone" };

  const { event, registration } = payload;
  const body = `ShowUp: You're ${registration.status} for ${event.title} on ${formatWhen(event.start_at)} at ${event.venue}. Ticket ID: ${registration.id}`;
  const indianNumber = extractIndianMobile(rawPhone);

  if (config.twoFactorApiKey && indianNumber) return send2FactorSms(indianNumber, payload, config.twoFactorApiKey);
  if (config.fast2smsApiKey && indianNumber) return sendFast2Sms(indianNumber, body, config.fast2smsApiKey);
  if (config.twilioSmsFrom) return twilioMessage("sms", toE164(rawPhone), config.twilioSmsFrom, body);
  return { channel: "sms", status: "skipped_not_configured" };
}

async function sendWhatsApp(payload) {
  const rawPhone = payload.profile.phone;
  if (!rawPhone) return { channel: "whatsapp", status: "skipped_no_phone" };
  if (!config.twilioWhatsappFrom) return { channel: "whatsapp", status: "skipped_not_configured" };

  const { event, registration } = payload;
  const body = `🎉 You're *${registration.status}* for *${event.title}*\n\n📅 *When*: ${formatWhen(event.start_at)}\n📍 *Venue*: ${event.venue}, ${event.city}\n🎟️ *Ticket ID*: ${registration.id}\n\nShow your QR ticket at the gate from your ShowUp dashboard.`;
  return twilioMessage("whatsapp", `whatsapp:${toE164(rawPhone)}`, config.twilioWhatsappFrom, body);
}

/** payload: { event: {id,title,start_at,venue,city}, profile: {name,email,phone}, registration: {id,status} } */
export async function sendRegistrationNotification(payload) {
  return Promise.all([sendEmail(payload), sendSms(payload), sendWhatsApp(payload)]);
}

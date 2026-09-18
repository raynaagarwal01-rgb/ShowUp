// Supabase Edge Function: sends the "you're registered" confirmation over
// email, SMS, and WhatsApp. Deploy with:
//
//   supabase functions deploy send-registration-notification
//
// Then set whichever provider secrets you actually have — each channel is
// skipped (not failed) when its secrets are missing, so you can turn these
// on one at a time:
//
//   supabase secrets set RESEND_API_KEY=... RESEND_FROM="Feastify <noreply@yourdomain.com>"
//   supabase secrets set TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_SMS_FROM=+1xxxxxxxxxx
//   supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
//
// Notes for the Indian market specifically:
//  - SMS to Indian numbers over an international gateway (Twilio included)
//    is routinely filtered by carriers unless the sender is registered with
//    India's DLT (Distributed Ledger Technology) telecom framework. An
//    India-first provider (MSG91, Gupshup) that handles DLT for you may be
//    more reliable than Twilio here — swap sendSms's implementation for
//    whichever you pick; the rest of this function doesn't need to change.
//  - WhatsApp requires an approved WhatsApp Business sender (Meta business
//    verification). Twilio's sandbox number works for testing but only
//    delivers to numbers that have opted in to the sandbox first.

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
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

async function sendEmail(payload: NotificationPayload): Promise<ChannelResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM");
  if (!apiKey || !from) return { channel: "email", status: "skipped_not_configured" };

  const { event, profile, registration } = payload;
  const subject = `You're ${registration.status} for ${event.title}`;
  const html = `
    <p>Hi ${profile.name},</p>
    <p>You're <strong>${registration.status}</strong> for <strong>${event.title}</strong>.</p>
    <p>${formatWhen(event.start_at)} · ${event.venue}, ${event.city}</p>
    <p>See your ticket and QR code any time from your Feastify dashboard.</p>
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
  const from = Deno.env.get("TWILIO_SMS_FROM");
  if (!payload.profile.phone) return { channel: "sms", status: "skipped_no_phone" };
  if (!from) return { channel: "sms", status: "skipped_not_configured" };

  const { event, registration } = payload;
  const body = `Feastify: you're ${registration.status} for ${event.title} on ${formatWhen(event.start_at)} at ${event.venue}.`;
  return twilioMessage("sms", payload.profile.phone, from, body);
}

async function sendWhatsApp(payload: NotificationPayload): Promise<ChannelResult> {
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM");
  if (!payload.profile.phone) return { channel: "whatsapp", status: "skipped_no_phone" };
  if (!from) return { channel: "whatsapp", status: "skipped_not_configured" };

  const { event, registration } = payload;
  const body = `You're *${registration.status}* for *${event.title}*\n${formatWhen(event.start_at)}\n${event.venue}, ${event.city}`;
  return twilioMessage("whatsapp", `whatsapp:${payload.profile.phone}`, from, body);
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

import { api } from "./api";
import type { EventRecord, Profile, Registration } from "../types";

export interface NotificationOutcome {
  attempted: boolean;
  channels: Array<"email" | "sms" | "whatsapp">;
  error?: string;
  recipientEmail?: string;
  recipientPhone?: string;
}

interface ChannelResult {
  channel: "email" | "sms" | "whatsapp";
  status: "sent" | "skipped_not_configured" | "skipped_no_phone" | "failed";
  detail?: string;
}

/**
 * Fires the registration-confirmed notification (email + SMS + WhatsApp).
 * This never throws and never blocks the caller — a notification failing
 * should not undo an otherwise-successful registration.
 *
 * The API server does the delivery (server/notify.js): Resend for email,
 * 2Factor/Fast2SMS/Twilio for SMS, Twilio for WhatsApp. Each channel is a
 * no-op until its provider is configured in .env, and this reports honestly
 * what happened: `attempted` is true only if at least one channel really sent
 * or failed, and `channels` lists the ones that actually went out.
 */
export async function notifyRegistrationConfirmed(
  _event: EventRecord,
  profile: Profile,
  registration: Registration,
): Promise<NotificationOutcome> {
  const wanted: Array<"email" | "sms" | "whatsapp"> = ["email"];
  if (profile.phone) wanted.push("sms", "whatsapp");

  const base = {
    recipientEmail: profile.email,
    recipientPhone: profile.phone ?? undefined,
  };

  try {
    const { results } = await api<{ results: ChannelResult[] }>("/notifications/registration-confirmed", {
      method: "POST",
      body: { registrationId: registration.id },
    });

    const sent = results.filter((r) => r.status === "sent").map((r) => r.channel);
    const failed = results.filter((r) => r.status === "failed");

    if (sent.length > 0) {
      return { attempted: true, channels: sent, ...base };
    }
    if (failed.length > 0) {
      return {
        attempted: true,
        channels: wanted,
        error: failed[0].detail || `${failed[0].channel} delivery failed`,
        ...base,
      };
    }
    // Every channel was skipped: no provider is configured on the server.
    return { attempted: false, channels: wanted, ...base };
  } catch (e) {
    return {
      attempted: true,
      channels: wanted,
      error: e instanceof Error ? e.message : "Unknown error",
      ...base,
    };
  }
}

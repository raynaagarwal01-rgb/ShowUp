import { supabase, isSupabaseConfigured } from "./supabase";
import type { EventRecord, Profile, Registration } from "../types";

export interface NotificationOutcome {
  attempted: boolean;
  channels: Array<"email" | "sms" | "whatsapp">;
  error?: string;
  recipientEmail?: string;
  recipientPhone?: string;
}

/**
 * Fires the registration-confirmed notification (email + SMS + WhatsApp).
 * This never throws and never blocks the caller — a notification failing
 * should not undo an otherwise-successful registration.
 *
 * - Supabase mode: invokes the `send-registration-notification` Edge
 *   Function (see supabase/functions/). That function delivers via Resend
 *   for email, Fast2SMS/Twilio for SMS, and Twilio for WhatsApp once configured.
 * - Demo mode: there's no backend to deliver anything for real, so this
 *   logs what *would* be sent instead of silently pretending to send it.
 */
export async function notifyRegistrationConfirmed(
  event: EventRecord,
  profile: Profile,
  registration: Registration,
): Promise<NotificationOutcome> {
  const channels: Array<"email" | "sms" | "whatsapp"> = ["email"];
  if (profile.phone) channels.push("sms", "whatsapp");

  const baseOutcome = {
    channels,
    recipientEmail: profile.email,
    recipientPhone: profile.phone ?? undefined,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.functions.invoke("send-registration-notification", {
        body: {
          event: {
            id: event.id,
            title: event.title,
            start_at: event.start_at,
            venue: event.venue,
            city: event.city,
          },
          profile: { name: profile.name, email: profile.email, phone: profile.phone ?? null },
          registration: { id: registration.id, status: registration.status },
        },
      });
      if (error) return { attempted: true, error: error.message, ...baseOutcome };
      return { attempted: true, ...baseOutcome };
    } catch (e) {
      return { attempted: true, error: e instanceof Error ? e.message : "Unknown error", ...baseOutcome };
    }
  }

  console.info(
    `[demo] Would notify ${profile.name} <${profile.email}> that "${event.title}" is ${registration.status} ` +
      (profile.phone
        ? `— email, SMS, and WhatsApp to ${profile.phone}.`
        : `— email only (no phone on file for SMS/WhatsApp).`),
  );
  return { attempted: false, ...baseOutcome };
}

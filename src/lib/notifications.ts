import { supabase, isSupabaseConfigured } from "./supabase";
import type { EventRecord, Profile, Registration } from "../types";

export interface NotificationOutcome {
  attempted: boolean;
  channels: Array<"email" | "sms" | "whatsapp">;
  error?: string;
}

/**
 * Fires the registration-confirmed notification (email + SMS + WhatsApp).
 * This never throws and never blocks the caller — a notification failing
 * should not undo an otherwise-successful registration.
 *
 * - Supabase mode: invokes the `send-registration-notification` Edge
 *   Function (see supabase/functions/). That function only actually
 *   delivers a channel once its provider secret is configured (RESEND_API_KEY
 *   for email, TWILIO_* for SMS/WhatsApp) — see the function's own comments.
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
      if (error) return { attempted: true, channels, error: error.message };
      return { attempted: true, channels };
    } catch (e) {
      return { attempted: true, channels, error: e instanceof Error ? e.message : "Unknown error" };
    }
  }

  console.info(
    `[demo] Would notify ${profile.name} <${profile.email}> that "${event.title}" is ${registration.status} ` +
      (profile.phone
        ? `— email, SMS, and WhatsApp to ${profile.phone}.`
        : `— email only (no phone on file for SMS/WhatsApp).`),
  );
  return { attempted: false, channels };
}

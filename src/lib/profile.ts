import type { Profile } from "../types";

/** State/city and a phone number are required before someone can browse
 * events or register — phone specifically because SMS/WhatsApp registration
 * notifications have nothing to send to without one. College stays optional. */
export function isOnboardingComplete(profile: Pick<Profile, "state" | "phone"> | null): boolean {
  return Boolean(profile?.state && profile?.phone);
}

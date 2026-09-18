import { supabase, isSupabaseConfigured } from "./supabase";
import { demoDb } from "./demoStorage";
import { newId, joinCode } from "./id";
import type {
  Announcement,
  EventQuestion,
  EventRecord,
  Profile,
  Registration,
  RegistrantView,
  RegistrationWithEvent,
  Team,
} from "../types";

export interface SeatStats {
  confirmed: number;
  waitlisted: number;
  capacity: number;
  full: boolean;
}

async function computeSeatStats(eventId: string): Promise<SeatStats> {
  const event = await getEvent(eventId);
  if (!event) return { confirmed: 0, waitlisted: 0, capacity: 0, full: true };

  if (isSupabaseConfigured && supabase) {
    const { count: confirmed } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "confirmed");
    const { count: waitlisted } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "waitlisted");
    return {
      confirmed: confirmed ?? 0,
      waitlisted: waitlisted ?? 0,
      capacity: event.capacity,
      full: (confirmed ?? 0) >= event.capacity,
    };
  }

  const regs = demoDb.getRegistrations().filter((r) => r.event_id === eventId);
  const confirmed = regs.filter((r) => r.status === "confirmed").length;
  const waitlisted = regs.filter((r) => r.status === "waitlisted").length;
  return { confirmed, waitlisted, capacity: event.capacity, full: confirmed >= event.capacity };
}

export async function listEvents(): Promise<EventRecord[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "published")
      .order("start_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as EventRecord[];
  }
  return demoDb
    .getEvents()
    .filter((e) => e.status === "published")
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
}

export async function getEvent(id: string): Promise<EventRecord | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as EventRecord) ?? null;
  }
  return demoDb.getEvents().find((e) => e.id === id) ?? null;
}

export async function listOrganizerEvents(userId: string): Promise<EventRecord[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("created_by", userId)
      .order("start_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as EventRecord[];
  }
  return demoDb
    .getEvents()
    .filter((e) => e.created_by === userId)
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
}

export async function createEvent(input: Omit<EventRecord, "id">): Promise<EventRecord> {
  const record: EventRecord = { ...input, id: newId("evt") };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("events").insert([record]).select().single();
    if (error) throw error;
    return data as EventRecord;
  }

  const events = demoDb.getEvents();
  demoDb.saveEvents([record, ...events]);
  return record;
}

export async function updateEvent(id: string, patch: Partial<EventRecord>): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("events").update(patch).eq("id", id);
    if (error) throw error;
    return;
  }
  const events = demoDb.getEvents();
  demoDb.saveEvents(events.map((e) => (e.id === id ? { ...e, ...patch } : e)));
}

export async function getSeatStats(eventId: string): Promise<SeatStats> {
  return computeSeatStats(eventId);
}

export async function getMyRegistrationForEvent(
  eventId: string,
  userId: string,
): Promise<Registration | null> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();
    return (data as Registration) ?? null;
  }
  const regs = demoDb.getRegistrations();
  return (
    regs.find((r) => r.event_id === eventId && r.user_id === userId && r.status !== "cancelled") ??
    null
  );
}

export async function registerSolo(eventId: string, userId: string): Promise<Registration> {
  const stats = await computeSeatStats(eventId);
  const status: Registration["status"] = stats.full ? "waitlisted" : "confirmed";
  const registration: Registration = {
    id: newId("reg"),
    event_id: eventId,
    user_id: userId,
    team_id: null,
    status,
    checked_in_at: null,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("registrations").insert([registration]);
    if (error) throw error;
    return registration;
  }

  demoDb.saveRegistrations([...demoDb.getRegistrations(), registration]);
  return registration;
}

export async function createTeam(
  eventId: string,
  userId: string,
  teamName: string,
): Promise<{ team: Team; registration: Registration }> {
  const stats = await computeSeatStats(eventId);
  const status: Registration["status"] = stats.full ? "waitlisted" : "confirmed";

  const team: Team = {
    id: newId("team"),
    event_id: eventId,
    name: teamName,
    join_code: joinCode(),
    created_by: userId,
    member_ids: [userId],
  };
  const registration: Registration = {
    id: newId("reg"),
    event_id: eventId,
    user_id: userId,
    team_id: team.id,
    status,
    checked_in_at: null,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { error: teamError } = await supabase.from("teams").insert([team]);
    if (teamError) throw teamError;
    const { error: regError } = await supabase.from("registrations").insert([registration]);
    if (regError) throw regError;
    return { team, registration };
  }

  demoDb.saveTeams([...demoDb.getTeams(), team]);
  demoDb.saveRegistrations([...demoDb.getRegistrations(), registration]);
  return { team, registration };
}

export async function joinTeam(
  eventId: string,
  userId: string,
  code: string,
): Promise<{ team: Team; registration: Registration }> {
  if (isSupabaseConfigured && supabase) {
    const { data: team, error } = await supabase
      .from("teams")
      .select("*")
      .eq("event_id", eventId)
      .eq("join_code", code.toUpperCase())
      .maybeSingle();
    if (error) throw error;
    if (!team) throw new Error("No team found with that join code for this event.");

    const updatedTeam: Team = { ...(team as Team), member_ids: [...(team as Team).member_ids, userId] };
    const { error: updateError } = await supabase
      .from("teams")
      .update({ member_ids: updatedTeam.member_ids })
      .eq("id", updatedTeam.id);
    if (updateError) throw updateError;

    const { data: existingReg } = await supabase
      .from("registrations")
      .select("*")
      .eq("team_id", updatedTeam.id)
      .limit(1)
      .maybeSingle();

    return { team: updatedTeam, registration: existingReg as Registration };
  }

  const teams = demoDb.getTeams();
  const team = teams.find((t) => t.event_id === eventId && t.join_code === code.toUpperCase());
  if (!team) throw new Error("No team found with that join code for this event.");
  if (team.member_ids.includes(userId)) throw new Error("You're already on this team.");

  const eventForCapacity = await getEvent(eventId);
  if (eventForCapacity && team.member_ids.length >= eventForCapacity.team_max) {
    throw new Error("This team is already full.");
  }

  const updatedTeam: Team = { ...team, member_ids: [...team.member_ids, userId] };
  demoDb.saveTeams(teams.map((t) => (t.id === team.id ? updatedTeam : t)));

  const registrations = demoDb.getRegistrations();
  const registration = registrations.find((r) => r.team_id === team.id) as Registration;
  return { team: updatedTeam, registration };
}

export async function cancelRegistration(registrationId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { data: reg } = await supabase
      .from("registrations")
      .select("*")
      .eq("id", registrationId)
      .maybeSingle();
    const { error } = await supabase
      .from("registrations")
      .update({ status: "cancelled" })
      .eq("id", registrationId);
    if (error) throw error;
    if (reg) await promoteNextWaitlisted((reg as Registration).event_id);
    return;
  }

  const regs = demoDb.getRegistrations();
  const target = regs.find((r) => r.id === registrationId);
  demoDb.saveRegistrations(
    regs.map((r) => (r.id === registrationId ? { ...r, status: "cancelled" as const } : r)),
  );
  if (target) await promoteNextWaitlisted(target.event_id);
}

async function promoteNextWaitlisted(eventId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { data: next } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "waitlisted")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase.from("registrations").update({ status: "confirmed" }).eq("id", (next as Registration).id);
    }
    return;
  }

  const regs = demoDb.getRegistrations();
  const waitlist = regs
    .filter((r) => r.event_id === eventId && r.status === "waitlisted")
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const next = waitlist[0];
  if (!next) return;
  demoDb.saveRegistrations(
    regs.map((r) => (r.id === next.id ? { ...r, status: "confirmed" as const } : r)),
  );
}

export async function checkIn(registrationId: string): Promise<Registration> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("registrations")
      .update({ checked_in_at: now })
      .eq("id", registrationId)
      .select()
      .single();
    if (error) throw error;
    return data as Registration;
  }

  const regs = demoDb.getRegistrations();
  const updated = regs.map((r) => (r.id === registrationId ? { ...r, checked_in_at: now } : r));
  demoDb.saveRegistrations(updated);
  const result = updated.find((r) => r.id === registrationId);
  if (!result) throw new Error("Registration not found.");
  return result;
}

export async function listMyRegistrations(userId: string): Promise<RegistrationWithEvent[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("registrations")
      .select("*, event:events(*)")
      .eq("user_id", userId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as RegistrationWithEvent[];
  }

  const regs = demoDb
    .getRegistrations()
    .filter((r) => r.user_id === userId && r.status !== "cancelled");
  const events = demoDb.getEvents();
  const teams = demoDb.getTeams();
  return regs
    .map((r) => {
      const event = events.find((e) => e.id === r.event_id);
      if (!event) return null;
      const team = r.team_id ? teams.find((t) => t.id === r.team_id) : undefined;
      return { ...r, event, team } as RegistrationWithEvent;
    })
    .filter((r): r is RegistrationWithEvent => r !== null)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listEventRegistrants(eventId: string): Promise<RegistrantView[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("registrations")
      .select("*, profile:profiles(*)")
      .eq("event_id", eventId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as RegistrantView[];
  }

  const regs = demoDb
    .getRegistrations()
    .filter((r) => r.event_id === eventId && r.status !== "cancelled")
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const accounts = demoDb.getAccounts();
  const teams = demoDb.getTeams();
  return regs
    .map((r) => {
      const account = accounts.find((a) => a.id === r.user_id);
      const profile: Profile = account
        ? { id: account.id, email: account.email, name: account.name, role: account.role }
        : { id: r.user_id, email: "unknown", name: "Unknown participant", role: "student" };
      const team = r.team_id ? teams.find((t) => t.id === r.team_id) : undefined;
      return { ...r, profile, team } as RegistrantView;
    });
}

export async function listEventAnnouncements(eventId: string): Promise<Announcement[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data as Announcement[];
      }
    } catch {
      // fallback to demoDb below
    }
  }
  return demoDb
    .getAnnouncements()
    .filter((a) => a.event_id === eventId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createAnnouncement(
  eventId: string,
  title: string,
  content: string,
  authorName: string,
  isUrgent: boolean = false
): Promise<Announcement> {
  const item: Announcement = {
    id: newId(),
    event_id: eventId,
    title,
    content,
    author_name: authorName,
    is_urgent: isUrgent,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .insert({
          id: item.id,
          event_id: eventId,
          title,
          content,
          author_name: authorName,
          is_urgent: isUrgent,
        })
        .select("*")
        .single();
      if (!error && data) {
        return data as Announcement;
      }
    } catch {
      // fallback to demoDb
    }
  }

  const all = demoDb.getAnnouncements();
  all.unshift(item);
  demoDb.saveAnnouncements(all);
  return item;
}

export async function listEventQuestions(eventId: string): Promise<EventQuestion[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("event_questions")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data as EventQuestion[];
      }
    } catch {
      // fallback to demoDb below
    }
  }
  return demoDb
    .getQuestions()
    .filter((q) => q.event_id === eventId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function askEventQuestion(
  eventId: string,
  userId: string | null,
  userName: string,
  question: string
): Promise<EventQuestion> {
  const item: EventQuestion = {
    id: newId(),
    event_id: eventId,
    user_id: userId,
    user_name: userName,
    question,
    answer: null,
    answered_by: null,
    answered_at: null,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("event_questions")
        .insert({
          id: item.id,
          event_id: eventId,
          user_id: userId,
          user_name: userName,
          question,
        })
        .select("*")
        .single();
      if (!error && data) {
        return data as EventQuestion;
      }
    } catch {
      // fallback to demoDb
    }
  }

  const all = demoDb.getQuestions();
  all.unshift(item);
  demoDb.saveQuestions(all);
  return item;
}

export async function answerEventQuestion(
  questionId: string,
  answer: string,
  answeredBy: string
): Promise<void> {
  const answeredAt = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from("event_questions")
        .update({
          answer,
          answered_by: answeredBy,
          answered_at: answeredAt,
        })
        .eq("id", questionId);
      if (!error) return;
    } catch {
      // fallback to demoDb
    }
  }

  const all = demoDb.getQuestions();
  const index = all.findIndex((q) => q.id === questionId);
  if (index !== -1) {
    all[index] = {
      ...all[index],
      answer,
      answered_by: answeredBy,
      answered_at: answeredAt,
    };
    demoDb.saveQuestions(all);
  }
}


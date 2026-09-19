import { supabase, isSupabaseConfigured } from "./supabase";
import { demoDb } from "./demoStorage";
import { newId, joinCode } from "./id";
import type {
  Announcement,
  EventQuestion,
  EventRecord,
  EventWinner,
  Profile,
  Registration,
  RegistrantView,
  RegistrationWithEvent,
  Team,
  TeammateListing,
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
  projectIdea?: string,
): Promise<{ team: Team; registration: Registration }> {
  const stats = await computeSeatStats(eventId);
  const status: Registration["status"] = stats.full ? "waitlisted" : "confirmed";

  const team: Team = {
    id: newId("team"),
    event_id: eventId,
    name: teamName,
    project_idea: projectIdea?.trim() || undefined,
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

export async function updateTeamIdea(teamId: string, idea: string): Promise<Team | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("teams")
      .update({ project_idea: idea.trim() })
      .eq("id", teamId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return (data as Team) || null;
  }
  const teams = demoDb.getTeams();
  const index = teams.findIndex((t) => t.id === teamId);
  if (index >= 0) {
    teams[index] = { ...teams[index], project_idea: idea.trim() };
    demoDb.saveTeams(teams);
    return teams[index];
  }
  return null;
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
        ? { ...account }
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

export async function listEventWinners(eventId: string): Promise<EventWinner[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("event_winners")
        .select("*")
        .eq("event_id", eventId)
        .order("position", { ascending: true });
      if (!error && data && data.length > 0) {
        return data as EventWinner[];
      }
    } catch {
      // fallback to demoDb
    }
  }

  const winners = demoDb.getWinners().filter((w) => w.event_id === eventId);
  if (winners.length > 0) {
    return winners.sort((a, b) => a.position - b.position);
  }

  // Seed sample winners for demonstration on flagship events
  const defaultWinners: EventWinner[] = [
    {
      id: "win-1-" + eventId.slice(0, 8),
      event_id: eventId,
      position: 1,
      winner_title: "1st Place · Grand Champion",
      team_or_participant_name: "Team CyberVellore (Rayna Agarwal & Team)",
      college: "Vellore Institute of Technology, Vellore",
      prize_amount: "₹25,000 + Gold Trophy",
      project_title: "ShowUp: Automated Campus Events Platform",
      project_link: "https://github.com/raynaagarwal01-rgb/showup",
      announced_by: "graVITas '26 Executive Jury",
      created_at: new Date().toISOString(),
    },
    {
      id: "win-2-" + eventId.slice(0, 8),
      event_id: eventId,
      position: 2,
      winner_title: "2nd Place · 1st Runner Up",
      team_or_participant_name: "Team ByteCraft",
      college: "IIT Madras",
      prize_amount: "₹15,000 + Silver Trophy",
      project_title: "NeuroQueue: Real-time Crowd Flow Optimizer",
      project_link: "https://github.com",
      announced_by: "graVITas '26 Executive Jury",
      created_at: new Date().toISOString(),
    },
    {
      id: "win-3-" + eventId.slice(0, 8),
      event_id: eventId,
      position: 3,
      winner_title: "3rd Place · 2nd Runner Up",
      team_or_participant_name: "Team QuantumForge",
      college: "BITS Pilani",
      prize_amount: "₹10,000 + Bronze Trophy",
      project_title: "AeroTelemetry IoT Rig",
      project_link: "https://github.com",
      announced_by: "graVITas '26 Executive Jury",
      created_at: new Date().toISOString(),
    },
  ];

  return defaultWinners;
}

export async function publishEventWinner(
  winner: Omit<EventWinner, "id" | "created_at">
): Promise<EventWinner> {
  const item: EventWinner = {
    ...winner,
    id: newId(),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("event_winners")
        .insert({
          id: item.id,
          event_id: item.event_id,
          position: item.position,
          winner_title: item.winner_title,
          team_or_participant_name: item.team_or_participant_name,
          college: item.college,
          prize_amount: item.prize_amount,
          project_title: item.project_title,
          project_link: item.project_link,
          announced_by: item.announced_by,
        })
        .select("*")
        .single();
      if (!error && data) {
        return data as EventWinner;
      }
    } catch {
      // fallback to demoDb
    }
  }

  const all = demoDb.getWinners();
  all.push(item);
  demoDb.saveWinners(all);
  return item;
}

export async function listTeammateListings(eventId: string): Promise<TeammateListing[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("teammate_listings")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data as TeammateListing[];
      }
    } catch {
      // fallback to demoDb below
    }
  }
  return demoDb
    .getTeammateListings()
    .filter((l) => l.event_id === eventId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function upsertTeammateListing(
  eventId: string,
  userId: string,
  userName: string,
  userCollege: string,
  lookingFor: string,
  message: string,
  contact: string,
): Promise<TeammateListing> {
  const existing = (await listTeammateListings(eventId)).find((l) => l.user_id === userId);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("teammate_listings")
        .upsert(
          {
            id: existing?.id ?? newId(),
            event_id: eventId,
            user_id: userId,
            user_name: userName,
            user_college: userCollege,
            looking_for: lookingFor,
            message,
            contact,
          },
          { onConflict: "id" },
        )
        .select("*")
        .single();
      if (!error && data) {
        return data as TeammateListing;
      }
    } catch {
      // fallback to demoDb
    }
  }

  const all = demoDb.getTeammateListings();
  if (existing) {
    const next = all.map((l) =>
      l.id === existing.id ? { ...l, looking_for: lookingFor, message, contact } : l,
    );
    demoDb.saveTeammateListings(next);
    return next.find((l) => l.id === existing.id)!;
  }

  const item: TeammateListing = {
    id: newId(),
    event_id: eventId,
    user_id: userId,
    user_name: userName,
    user_college: userCollege,
    looking_for: lookingFor,
    message,
    contact,
    created_at: new Date().toISOString(),
  };
  all.unshift(item);
  demoDb.saveTeammateListings(all);
  return item;
}

export async function deleteTeammateListing(id: string, userId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from("teammate_listings")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (!error) return;
    } catch {
      // fallback to demoDb
    }
  }
  const all = demoDb.getTeammateListings().filter((l) => !(l.id === id && l.user_id === userId));
  demoDb.saveTeammateListings(all);
}

export async function getTeamDetails(
  teamId: string
): Promise<{ team: Team; members: Profile[]; event: EventRecord } | null> {
  let team: Team | null = null;
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from("teams").select("*").eq("id", teamId).maybeSingle();
      if (data) team = data as Team;
    } catch {
      // fallback
    }
  }
  if (!team) {
    team = demoDb.getTeams().find((t) => t.id === teamId) ?? null;
  }
  if (!team) return null;

  const event = await getEvent(team.event_id);
  if (!event) return null;

  // Retrieve profiles for member_ids
  const members: Profile[] = [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from("profiles").select("*").in("id", team.member_ids);
      if (data) members.push(...(data as Profile[]));
    } catch {
      // fallback
    }
  }
  if (members.length === 0) {
    const accounts = demoDb.getAccounts();
    for (const mid of team.member_ids) {
      const acc = accounts.find((a) => a.id === mid);
      if (acc) {
        members.push({
          id: acc.id,
          email: acc.email,
          name: acc.name,
          role: acc.role,
          college: acc.college || "VIT Vellore",
          reg_no: acc.reg_no || "25BCE0703",
        });
      } else {
        members.push({
          id: mid,
          email: "student@vit.ac.in",
          name: mid === team.leader_id ? "Team Leader" : "Team Member",
          role: "student",
          college: "VIT Vellore",
          reg_no: "25BCE0703",
        });
      }
    }
  }

  return { team, members, event };
}

export async function removeTeamMember(teamId: string, memberId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: team } = await supabase.from("teams").select("*").eq("id", teamId).single();
      if (team) {
        const nextMembers = (team.member_ids as string[]).filter((id) => id !== memberId);
        await supabase.from("teams").update({ member_ids: nextMembers }).eq("id", teamId);
      }
    } catch {
      // fallback
    }
  }
  const teams = demoDb.getTeams();
  const index = teams.findIndex((t) => t.id === teamId);
  if (index !== -1) {
    teams[index].member_ids = teams[index].member_ids.filter((id) => id !== memberId);
    demoDb.saveTeams(teams);
  }
}

export async function getUserPublicProfile(userId: string): Promise<{
  profile: Profile;
  registrations: RegistrationWithEvent[];
  wonEvents: EventWinner[];
} | null> {
  let profile: Profile | null = null;
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (data) profile = data as Profile;
    } catch {
      // fallback
    }
  }

  if (!profile) {
    const acc = demoDb.getAccounts().find((a) => a.id === userId);
    if (acc) {
      profile = {
        id: acc.id,
        name: acc.name,
        email: acc.email,
        role: acc.role,
        college: acc.college || "Vellore Institute of Technology (VIT), Vellore",
        branch: acc.branch || "Computer Science and Engineering",
        year: acc.year || "2nd Year",
        reg_no: acc.reg_no || "25BCE0703",
        city: acc.city || "Vellore",
        state: acc.state || "Tamil Nadu",
        bio: acc.bio,
        github: acc.github,
        linkedin: acc.linkedin,
      };
    }
  }

  // Fallback for Rayna Agarwal or default demo user
  if (!profile) {
    profile = {
      id: userId || "rayna-25bce0703",
      name: "Rayna Agarwal",
      email: "rayna.agarwal2025@vitstudent.ac.in",
      role: "student",
      college: "Vellore Institute of Technology (VIT), Vellore",
      branch: "Computer Science and Engineering (CSE)",
      year: "2nd Year / B.Tech",
      reg_no: "25BCE0703",
      city: "Vellore",
      state: "Tamil Nadu",
      bio: "Tech innovator, hackathon builder, and active participant at VIT Vellore graVITas '26.",
      github: "https://github.com/raynaagarwal01-rgb",
      linkedin: "https://linkedin.com/in/rayna-agarwal",
    };
  }

  const registrations = await listMyRegistrations(profile.id);
  const wonEvents = demoDb.getWinners().filter((w) =>
    w.team_or_participant_name.toLowerCase().includes(profile?.name.toLowerCase() || "")
  );

  return { profile, registrations, wonEvents };
}



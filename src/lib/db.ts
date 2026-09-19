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
  TeammateInput,
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

export async function deleteEvent(id: string, organizerId?: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("registrations").delete().eq("event_id", id);
    await supabase.from("teams").delete().eq("event_id", id);
    await supabase.from("announcements").delete().eq("event_id", id);
    await supabase.from("event_questions").delete().eq("event_id", id);
    await supabase.from("event_winners").delete().eq("event_id", id);
    await supabase.from("teammate_listings").delete().eq("event_id", id);

    let query = supabase.from("events").delete().eq("id", id);
    if (organizerId) {
      query = query.eq("created_by", organizerId);
    }
    const { error } = await query;
    if (error) throw error;
    return;
  }

  // Demo DB mode
  demoDb.saveEvents(demoDb.getEvents().filter((e) => e.id !== id));
  demoDb.saveRegistrations(demoDb.getRegistrations().filter((r) => r.event_id !== id));
  demoDb.saveTeams(demoDb.getTeams().filter((t) => t.event_id !== id));
  demoDb.saveAnnouncements(demoDb.getAnnouncements().filter((a) => a.event_id !== id));
  demoDb.saveQuestions(demoDb.getQuestions().filter((q) => q.event_id !== id));
  demoDb.saveWinners(demoDb.getWinners().filter((w) => w.event_id !== id));
  demoDb.saveTeammateListings(demoDb.getTeammateListings().filter((l) => l.event_id !== id));
}

export async function createSampleEventForOrganizer(user: {
  id: string;
  name?: string;
  college?: string;
  city?: string;
  state?: string;
}): Promise<EventRecord> {
  const eventId = newId("evt");
  const now = new Date();
  const startAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const endAt = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString();
  const deadline = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();

  const clubName = user.name ? `${user.name}'s Tech Club` : "ShowUp Innovation Lab";
  const college = user.college || "VIT Vellore";
  const city = user.city || "Vellore";
  const state = user.state || "Tamil Nadu";

  const event: EventRecord = {
    id: eventId,
    club_id: user.id,
    club_name: clubName,
    title: "HackSphere 2026: National Hackathon",
    tagline: "36-Hour National AI & Systems Hackathon",
    description:
      "A premier 36-hour hackathon bringing together students across India to build innovative solutions in AI, Climate Tech, and FinTech. Features 1-on-1 industry mentorship, cloud credits, and cash prizes.",
    rules: [
      "Teams of 2 to 4 members. Inter-college teams are welcome.",
      "All code and prototypes must be developed during the hackathon period.",
      "Projects require a public GitHub repository and a 3-minute pitch presentation.",
      "Organizers reserve the right to disqualify entries violating the code of conduct.",
    ],
    category: "Hackathon",
    scope: "both",
    state,
    city,
    college,
    venue: "Dr. APJ Abdul Kalam Innovation Auditorium, Tech Tower",
    start_at: startAt,
    end_at: endAt,
    registration_deadline: deadline,
    capacity: 100,
    fee: 0,
    team_min: 2,
    team_max: 4,
    banner_hue: 220,
    status: "published",
    created_by: user.id,
  };

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("events").insert([event]);
    if (error) throw error;
    return event;
  }

  // Demo DB mode: Seed the event, sample teams, sample registrants, and an announcement!
  const demoAccounts = demoDb.getAccounts();
  const sampleUsers: Array<{
    id: string;
    name: string;
    email: string;
    college: string;
    branch: string;
    phone: string;
  }> = [
    {
      id: "demo_usr_ananya",
      name: "Ananya Sharma",
      email: "ananya.sharma@vitstudent.ac.in",
      college,
      branch: "Computer Science & Engg",
      phone: "+91 98765 43210",
    },
    {
      id: "demo_usr_rohan",
      name: "Rohan Mehta",
      email: "rohan.mehta@vitstudent.ac.in",
      college,
      branch: "Information Technology",
      phone: "+91 98765 43211",
    },
    {
      id: "demo_usr_vikram",
      name: "Vikram Malhotra",
      email: "vikram.m@iitm.ac.in",
      college: "IIT Madras",
      branch: "Electrical & Computer Engg",
      phone: "+91 98765 43212",
    },
    {
      id: "demo_usr_priya",
      name: "Priya Patel",
      email: "priya.patel@bmsce.ac.in",
      college: "BMS College of Engineering",
      branch: "Artificial Intelligence",
      phone: "+91 98765 43213",
    },
    {
      id: "demo_usr_sameer",
      name: "Sameer Khan",
      email: "sameer.khan@bits-pilani.ac.in",
      college: "BITS Pilani",
      branch: "Software Systems",
      phone: "+91 98765 43214",
    },
  ];

  const updatedAccounts = [...demoAccounts];
  for (const s of sampleUsers) {
    if (!updatedAccounts.some((a) => a.id === s.id)) {
      updatedAccounts.push({
        id: s.id,
        email: s.email,
        name: s.name,
        role: "student",
        college: s.college,
        branch: s.branch,
        phone: s.phone,
        password: "demopassword",
      });
    }
  }
  demoDb.saveAccounts(updatedAccounts);

  const team1: Team = {
    id: "team_neuralcraft_" + eventId,
    event_id: eventId,
    name: "NeuralCraft",
    join_code: "NC8821",
    created_by: "demo_usr_ananya",
    leader_id: "demo_usr_ananya",
    member_ids: ["demo_usr_ananya", "demo_usr_rohan"],
    project_idea: "Autonomous drone pipeline inspection with edge AI and real-time thermal anomaly detection.",
  };

  const team2: Team = {
    id: "team_codeforge_" + eventId,
    event_id: eventId,
    name: "CodeForge",
    join_code: "CF4910",
    created_by: "demo_usr_vikram",
    leader_id: "demo_usr_vikram",
    member_ids: ["demo_usr_vikram", "demo_usr_priya"],
    project_idea: "Decentralized carbon credit ledger and green energy certificate trading platform for universities.",
  };

  const registrations: Registration[] = [
    {
      id: newId("reg"),
      event_id: eventId,
      user_id: "demo_usr_ananya",
      team_id: team1.id,
      status: "confirmed",
      checked_in_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: newId("reg"),
      event_id: eventId,
      user_id: "demo_usr_rohan",
      team_id: team1.id,
      status: "confirmed",
      checked_in_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: newId("reg"),
      event_id: eventId,
      user_id: "demo_usr_vikram",
      team_id: team2.id,
      status: "confirmed",
      checked_in_at: null,
      created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: newId("reg"),
      event_id: eventId,
      user_id: "demo_usr_priya",
      team_id: team2.id,
      status: "confirmed",
      checked_in_at: null,
      created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: newId("reg"),
      event_id: eventId,
      user_id: "demo_usr_sameer",
      team_id: null,
      status: "confirmed",
      checked_in_at: null,
      created_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const announcement: Announcement = {
    id: newId(),
    event_id: eventId,
    title: "Hackathon Briefing & Mentor Allocation Schedule",
    content:
      "Welcome teams! Mentor check-ins are now live in Block C Labs. Please have your GitHub repo created and project pitch ready.",
    author_name: clubName,
    is_urgent: true,
    created_at: new Date().toISOString(),
  };

  demoDb.saveEvents([event, ...demoDb.getEvents()]);
  demoDb.saveTeams([...demoDb.getTeams(), team1, team2]);
  demoDb.saveRegistrations([...demoDb.getRegistrations(), ...registrations]);
  demoDb.saveAnnouncements([...demoDb.getAnnouncements(), announcement]);

  return event;
}

export async function getSeatStats(eventId: string): Promise<SeatStats> {
  return computeSeatStats(eventId);
}

export async function getMyRegistrationForEvent(
  eventId: string,
  userId: string,
): Promise<Registration | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .neq("status", "cancelled")
        .maybeSingle();
      if (!error && data) return data as Registration;
    } catch {
      // fallback
    }
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

  // Always save locally so student registration is never blocked
  demoDb.saveRegistrations([
    ...demoDb.getRegistrations().filter((r) => !(r.event_id === eventId && r.user_id === userId)),
    registration,
  ]);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("registrations").insert([registration]);
    } catch (err) {
      console.warn("Supabase registerSolo sync error (persisted locally):", err);
    }
  }

  return registration;
}

export async function createTeam(
  eventId: string,
  userId: string,
  teamName: string,
  projectIdea?: string,
  teammates?: TeammateInput[],
): Promise<{ team: Team; registration: Registration }> {
  const stats = await computeSeatStats(eventId);
  const status: Registration["status"] = stats.full ? "waitlisted" : "confirmed";

  const cleanIdea = projectIdea?.trim() || undefined;
  const teamId = newId("team");

  // Leader member ID
  const memberIds: string[] = [userId];

  // If teammates are supplied, create their accounts and registrations
  const teammateAccounts: Array<Profile & { password: string }> = [];
  const teammateRegistrations: Registration[] = [];

  if (teammates && teammates.length > 0) {
    const existingAccounts = demoDb.getAccounts();
    for (const t of teammates) {
      if (!t.name?.trim() || !t.email?.trim()) continue;

      // Check if account already exists
      const existing = existingAccounts.find(
        (a) => a.email.toLowerCase() === t.email.trim().toLowerCase()
      );

      let memberUserId: string;
      if (existing) {
        memberUserId = existing.id;
      } else {
        memberUserId = newId("usr");
        const newProfile = {
          id: memberUserId,
          name: t.name.trim(),
          email: t.email.trim().toLowerCase(),
          phone: t.phone?.trim() || undefined,
          college: t.college?.trim() || "VIT Vellore",
          reg_no: t.reg_no?.trim() || undefined,
          branch: t.branch?.trim() || "Engineering",
          role: "student" as const,
          password: "demopassword",
        };
        teammateAccounts.push(newProfile);
      }

      if (!memberIds.includes(memberUserId)) {
        memberIds.push(memberUserId);
        teammateRegistrations.push({
          id: newId("reg"),
          event_id: eventId,
          user_id: memberUserId,
          team_id: teamId,
          status,
          checked_in_at: null,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  const team: Team = {
    id: teamId,
    event_id: eventId,
    name: teamName.trim(),
    project_idea: cleanIdea,
    join_code: joinCode(),
    created_by: userId,
    leader_id: userId,
    member_ids: memberIds,
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

  // 1. Always persist locally to demoDb immediately
  if (teammateAccounts.length > 0) {
    demoDb.saveAccounts([...demoDb.getAccounts(), ...teammateAccounts]);
  }

  const localTeams = demoDb.getTeams().filter((t) => t.id !== team.id);
  demoDb.saveTeams([...localTeams, team]);

  const allNewRegs = [registration, ...teammateRegistrations];
  const allNewUserIds = new Set(allNewRegs.map((r) => r.user_id));
  const localRegs = demoDb
    .getRegistrations()
    .filter((r) => !(r.event_id === eventId && allNewUserIds.has(r.user_id)));
  demoDb.saveRegistrations([...localRegs, ...allNewRegs]);

  // 2. Sync to Supabase if configured, with schema-safe column handling
  if (isSupabaseConfigured && supabase) {
    try {
      const supabaseTeamPayload: Record<string, any> = {
        id: team.id,
        event_id: team.event_id,
        name: team.name,
        join_code: team.join_code,
        created_by: team.created_by,
        member_ids: team.member_ids,
      };

      if (cleanIdea) {
        const { error: ideaError } = await supabase
          .from("teams")
          .insert([{ ...supabaseTeamPayload, project_idea: cleanIdea }]);

        if (ideaError) {
          await supabase.from("teams").insert([supabaseTeamPayload]);
        }
      } else {
        await supabase.from("teams").insert([supabaseTeamPayload]);
      }

      await supabase.from("registrations").insert(allNewRegs);
    } catch (err) {
      console.warn("Supabase createTeam sync error (team saved locally):", err);
    }
  }

  return { team, registration };
}

export async function updateTeamIdea(teamId: string, idea: string): Promise<Team | null> {
  const teams = demoDb.getTeams();
  const index = teams.findIndex((t) => t.id === teamId);
  if (index >= 0) {
    teams[index] = { ...teams[index], project_idea: idea.trim() };
    demoDb.saveTeams(teams);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from("teams")
        .update({ project_idea: idea.trim() })
        .eq("id", teamId)
        .select()
        .maybeSingle();
      if (data) return data as Team;
    } catch {
      // column may not exist in Supabase schema
    }
  }

  return index >= 0 ? teams[index] : null;
}

export async function joinTeam(
  eventId: string,
  userId: string,
  code: string,
): Promise<{ team: Team; registration: Registration }> {
  let matchedTeam: Team | null = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: team } = await supabase
        .from("teams")
        .select("*")
        .eq("event_id", eventId)
        .eq("join_code", code.toUpperCase())
        .maybeSingle();
      if (team) matchedTeam = team as Team;
    } catch {
      // fallback
    }
  }

  if (!matchedTeam) {
    const teams = demoDb.getTeams();
    matchedTeam = teams.find((t) => t.event_id === eventId && t.join_code === code.toUpperCase()) ?? null;
  }

  if (!matchedTeam) throw new Error("No team found with that join code for this event.");
  if (matchedTeam.member_ids.includes(userId)) throw new Error("You're already on this team.");

  const eventForCapacity = await getEvent(eventId);
  if (eventForCapacity && matchedTeam.member_ids.length >= eventForCapacity.team_max) {
    throw new Error("This team is already full.");
  }

  const updatedTeam: Team = {
    ...matchedTeam,
    member_ids: [...matchedTeam.member_ids, userId],
  };

  const newReg: Registration = {
    id: newId("reg"),
    event_id: eventId,
    user_id: userId,
    team_id: updatedTeam.id,
    status: "confirmed",
    checked_in_at: null,
    created_at: new Date().toISOString(),
  };

  // Save to demo storage
  const localTeams = demoDb.getTeams();
  demoDb.saveTeams(localTeams.map((t) => (t.id === updatedTeam.id ? updatedTeam : t)));
  const localRegs = demoDb.getRegistrations();
  demoDb.saveRegistrations([
    ...localRegs.filter((r) => !(r.event_id === eventId && r.user_id === userId)),
    newReg,
  ]);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("teams")
        .update({ member_ids: updatedTeam.member_ids })
        .eq("id", updatedTeam.id);
      await supabase.from("registrations").insert([newReg]);
    } catch (err) {
      console.warn("Supabase joinTeam sync error (saved locally):", err);
    }
  }

  return { team: updatedTeam, registration: newReg };
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



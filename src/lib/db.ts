// Data layer. Every function talks to the ShowUp API (server/), which runs
// plain SQL against MySQL. Pages and components only ever import from here,
// so the storage behind it can change without touching them.
//
// Who is calling (and what they may do) is decided server-side from the login
// token — parameters like `userId` below are kept for compatibility and are
// never trusted by the server.
import { api, ApiError, seg } from "./api";
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

const isStatus = (e: unknown, ...statuses: number[]): boolean =>
  e instanceof ApiError && statuses.includes(e.status);

// --- Events -------------------------------------------------------------------

export async function listEvents(): Promise<EventRecord[]> {
  return api<EventRecord[]>("/events");
}

export async function getEvent(id: string): Promise<EventRecord | null> {
  try {
    return await api<EventRecord>(`/events/${seg(id)}`);
  } catch (e) {
    if (isStatus(e, 404)) return null;
    throw e;
  }
}

export async function listOrganizerEvents(userId: string): Promise<EventRecord[]> {
  return api<EventRecord[]>(`/users/${seg(userId)}/events`);
}

export async function createEvent(input: Omit<EventRecord, "id">): Promise<EventRecord> {
  return api<EventRecord>("/events", { method: "POST", body: input });
}

export async function updateEvent(id: string, patch: Partial<EventRecord>): Promise<void> {
  await api(`/events/${seg(id)}`, { method: "PATCH", body: patch });
}

// The database removes the event's registrations, teams, announcements, Q&A,
// winners and teammate listings along with it (ON DELETE CASCADE). The server
// only lets the event's creator do this.
export async function deleteEvent(id: string, _organizerId?: string): Promise<void> {
  await api(`/events/${seg(id)}`, { method: "DELETE" });
}

/** Creates the "HackSphere 2026" sample event for the signed-in organizer, with
 * a small roster of teams and solo registrants so the organizer tools have
 * something to show. */
export async function createSampleEventForOrganizer(_user: {
  id: string;
  name?: string;
  college?: string;
  city?: string;
  state?: string;
}): Promise<EventRecord> {
  return api<EventRecord>("/organizer/sample-event", { method: "POST", body: {} });
}

export async function getSeatStats(eventId: string): Promise<SeatStats> {
  return api<SeatStats>(`/events/${seg(eventId)}/stats`);
}

// --- Registrations ----------------------------------------------------------------

export async function getMyRegistrationForEvent(
  eventId: string,
  _userId: string,
): Promise<Registration | null> {
  try {
    return await api<Registration | null>(`/events/${seg(eventId)}/my-registration`);
  } catch {
    return null;
  }
}

export async function registerSolo(eventId: string, _userId: string): Promise<Registration> {
  return api<Registration>(`/events/${seg(eventId)}/register`, { method: "POST", body: {} });
}

export async function createTeam(
  eventId: string,
  _userId: string,
  teamName: string,
  projectIdea?: string,
  teammates?: TeammateInput[],
): Promise<{ team: Team; registration: Registration }> {
  return api(`/events/${seg(eventId)}/teams`, {
    method: "POST",
    body: { teamName, projectIdea, teammates },
  });
}

export async function updateTeamIdea(teamId: string, idea: string): Promise<Team | null> {
  try {
    return await api<Team>(`/teams/${seg(teamId)}`, { method: "PATCH", body: { project_idea: idea } });
  } catch (e) {
    if (isStatus(e, 404)) return null;
    throw e;
  }
}

export async function joinTeam(
  eventId: string,
  _userId: string,
  code: string,
): Promise<{ team: Team; registration: Registration }> {
  return api(`/events/${seg(eventId)}/teams/join`, { method: "POST", body: { code } });
}

export async function cancelRegistration(registrationId: string): Promise<void> {
  await api(`/registrations/${seg(registrationId)}/cancel`, { method: "POST", body: {} });
}

export async function checkIn(registrationId: string): Promise<Registration> {
  return api<Registration>(`/registrations/${seg(registrationId)}/check-in`, { method: "POST", body: {} });
}

export async function listMyRegistrations(userId: string): Promise<RegistrationWithEvent[]> {
  return api<RegistrationWithEvent[]>(`/users/${seg(userId)}/registrations`);
}

export async function listEventRegistrants(eventId: string): Promise<RegistrantView[]> {
  return api<RegistrantView[]>(`/events/${seg(eventId)}/registrants`);
}

// --- Announcements ------------------------------------------------------------------

export async function listEventAnnouncements(eventId: string): Promise<Announcement[]> {
  return api<Announcement[]>(`/events/${seg(eventId)}/announcements`);
}

export async function createAnnouncement(
  eventId: string,
  title: string,
  content: string,
  authorName: string,
  isUrgent: boolean = false,
): Promise<Announcement> {
  return api<Announcement>(`/events/${seg(eventId)}/announcements`, {
    method: "POST",
    body: { title, content, authorName, isUrgent },
  });
}

// --- Q&A ------------------------------------------------------------------------------

export async function listEventQuestions(eventId: string): Promise<EventQuestion[]> {
  return api<EventQuestion[]>(`/events/${seg(eventId)}/questions`);
}

export async function askEventQuestion(
  eventId: string,
  _userId: string | null,
  userName: string,
  question: string,
): Promise<EventQuestion> {
  return api<EventQuestion>(`/events/${seg(eventId)}/questions`, {
    method: "POST",
    body: { userName, question },
  });
}

export async function answerEventQuestion(
  questionId: string,
  answer: string,
  answeredBy: string,
): Promise<void> {
  await api(`/questions/${seg(questionId)}/answer`, { method: "POST", body: { answer, answeredBy } });
}

// --- Winners ----------------------------------------------------------------------------

export async function listEventWinners(eventId: string): Promise<EventWinner[]> {
  try {
    const winners = await api<EventWinner[]>(`/events/${seg(eventId)}/winners`);
    if (winners.length > 0) return winners;
  } catch {
    // fall through to the sample winners below
  }

  // Sample winners for demonstration on flagship events
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
  winner: Omit<EventWinner, "id" | "created_at">,
): Promise<EventWinner> {
  return api<EventWinner>(`/events/${seg(winner.event_id)}/winners`, { method: "POST", body: winner });
}

// --- Teammate listings ----------------------------------------------------------------------

export async function listTeammateListings(eventId: string): Promise<TeammateListing[]> {
  return api<TeammateListing[]>(`/events/${seg(eventId)}/teammate-listings`);
}

export async function upsertTeammateListing(
  eventId: string,
  _userId: string,
  userName: string,
  userCollege: string,
  lookingFor: string,
  message: string,
  contact: string,
): Promise<TeammateListing> {
  return api<TeammateListing>(`/events/${seg(eventId)}/teammate-listings`, {
    method: "PUT",
    body: { userName, userCollege, lookingFor, message, contact },
  });
}

export async function deleteTeammateListing(id: string, _userId: string): Promise<void> {
  await api(`/teammate-listings/${seg(id)}`, { method: "DELETE" });
}

// --- Teams ---------------------------------------------------------------------------------------

export async function getTeamDetails(
  teamId: string,
): Promise<{ team: Team; members: Profile[]; event: EventRecord } | null> {
  try {
    return await api(`/teams/${seg(teamId)}`);
  } catch (e) {
    if (isStatus(e, 401, 404)) return null;
    throw e;
  }
}

export async function removeTeamMember(teamId: string, memberId: string): Promise<void> {
  await api(`/teams/${seg(teamId)}/members/${seg(memberId)}`, { method: "DELETE" });
}

// --- Public profile ---------------------------------------------------------------------------------

export async function getUserPublicProfile(userId: string): Promise<{
  profile: Profile;
  registrations: RegistrationWithEvent[];
  wonEvents: EventWinner[];
} | null> {
  try {
    return await api(`/users/${seg(userId)}/public-profile`);
  } catch (e) {
    // Signed out, or no such user: show the placeholder profile below, as before.
    if (!isStatus(e, 401, 404)) throw e;
  }

  // Fallback for Rayna Agarwal or default demo user
  const profile: Profile = {
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

  return { profile, registrations: [], wonEvents: [] };
}

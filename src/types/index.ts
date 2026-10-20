// Shapes of the JSON the API returns. Each one mirrors a MySQL table (or a
// JOIN of tables) from sql/schema.sql. Dates arrive as ISO strings.

export type Role = "student" | "organizer";

/** users table (without password_hash). */
export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  college: string | null;
  reg_no: string | null;
  created_at: string;
}

export type EventCategory = "Hackathon" | "Workshop" | "Competition" | "Cultural" | "Talk";

/** The fields an organizer fills in when creating or editing an event. */
export interface EventInput {
  title: string;
  description: string;
  category: EventCategory;
  venue: string;
  event_date: string;
  registration_deadline: string;
  capacity: number;
  fee: number;
  team_min: number;
  team_max: number;
}

/** events table + organizer name/college (JOIN users) + confirmed count. */
export interface EventRecord extends EventInput {
  id: number;
  organizer_id: number;
  organizer_name: string;
  organizer_college: string | null;
  created_at: string;
  /** COUNT of confirmed registrations — present on /api/events responses. */
  registered_count?: number;
}

export type RegistrationStatus = "confirmed" | "cancelled";

/** registrations table. */
export interface Registration {
  id: number;
  user_id: number;
  event_id: number;
  team_id: number | null;
  status: RegistrationStatus;
  checked_in_at: string | null;
  registered_at: string;
}

/** A row of GET /api/my-registrations. */
export interface MyRegistration extends Registration {
  event: EventRecord;
  team: { id: number; name: string; join_code: string; leader_id: number } | null;
}

/** A row of GET /api/events/:id/registrations (organizer view). */
export interface Participant {
  id: number;
  user_id: number;
  team_id: number | null;
  status: RegistrationStatus;
  checked_in_at: string | null;
  registered_at: string;
  name: string;
  email: string;
  college: string | null;
  reg_no: string | null;
  team_name: string | null;
  join_code: string | null;
  leader_id: number | null;
}

export interface TeamMember {
  id: number;
  name: string;
  college: string | null;
  joined_at: string;
}

/** teams table + its members (team_members JOIN users). */
export interface Team {
  id: number;
  event_id: number;
  name: string;
  join_code: string;
  leader_id: number;
  created_at: string;
  members: TeamMember[];
}

/** GET /api/teams/:id also includes a little of the event. */
export interface TeamDetails extends Team {
  event_title: string;
  team_min: number;
  team_max: number;
}

export interface Announcement {
  id: number;
  event_id: number;
  title: string;
  content: string;
  created_at: string;
}

export interface EventQuestion {
  id: number;
  event_id: number;
  user_id: number;
  user_name: string;
  question: string;
  answer: string | null;
  created_at: string;
}

export interface EventWinner {
  id: number;
  event_id: number;
  position: number;
  winner_name: string;
  prize: string | null;
}

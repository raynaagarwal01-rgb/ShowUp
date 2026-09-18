export type Role = "student" | "organizer" | "admin";

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: Role;
  state?: string;
  city?: string;
  college?: string;
  branch?: string;
  year?: string;
  phone?: string;
  reg_no?: string;
  bio?: string;
  github?: string;
  linkedin?: string;
}

export type EventCategory =
  | "Hackathon"
  | "Workshop"
  | "Competition"
  | "Cultural"
  | "Talk";

export type EventScope = "internal" | "external" | "both";

export interface EventRecord {
  id: string;
  club_id: string;
  club_name: string;
  title: string;
  tagline: string;
  description: string;
  rules: string[];
  category: EventCategory;
  scope: EventScope;
  state: string;
  city: string;
  college: string;
  venue: string;
  start_at: string;
  end_at: string;
  registration_deadline: string;
  capacity: number;
  fee: number;
  team_min: number;
  team_max: number;
  banner_hue: number;
  status: "published" | "draft";
  created_by: string;
}

export type RegistrationStatus = "confirmed" | "waitlisted" | "cancelled";

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  team_id: string | null;
  status: RegistrationStatus;
  checked_in_at: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  event_id: string;
  name: string;
  join_code: string;
  created_by: string;
  leader_id?: string;
  member_ids: string[];
}

export interface RegistrationWithEvent extends Registration {
  event: EventRecord;
  team?: Team;
}

export interface RegistrantView extends Registration {
  profile: Profile;
  team?: Team;
}

export interface Announcement {
  id: string;
  event_id: string;
  title: string;
  content: string;
  author_name: string;
  is_urgent: boolean;
  created_at: string;
}

export interface EventQuestion {
  id: string;
  event_id: string;
  user_id: string | null;
  user_name: string;
  question: string;
  answer: string | null;
  answered_by: string | null;
  answered_at: string | null;
  created_at: string;
}

export interface EventWinner {
  id: string;
  event_id: string;
  position: number;
  winner_title: string;
  team_or_participant_name: string;
  college: string;
  prize_amount: string;
  project_title: string;
  project_link: string;
  announced_by: string;
  created_at: string;
}

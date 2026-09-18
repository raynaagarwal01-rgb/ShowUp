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

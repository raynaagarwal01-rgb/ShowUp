import type { Announcement, EventQuestion, EventRecord, EventWinner, Profile, Registration, Team } from "../types";
import { seedEvents } from "./demoSeed";

const KEYS = {
  events: "feastify_demo_events",
  registrations: "feastify_demo_registrations",
  teams: "feastify_demo_teams",
  accounts: "feastify_demo_accounts",
  session: "feastify_demo_session",
  announcements: "feastify_demo_announcements",
  questions: "feastify_demo_questions",
  winners: "feastify_demo_winners",
} as const;

interface Account extends Profile {
  password: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode etc.) — demo mode degrades to in-memory for this tick
  }
}

export const demoDb = {
  getEvents(): EventRecord[] {
    let events = read<EventRecord[] | null>(KEYS.events, null);
    // Cached seed data from before events carried a city/state/college (schema
    // change) — demo events are disposable, so just reseed rather than backfill.
    const stale = events !== null && events.some((e) => !e.city || !e.college);
    if (!events || stale) {
      events = seedEvents();
      write(KEYS.events, events);
    }
    return events;
  },
  saveEvents(events: EventRecord[]): void {
    write(KEYS.events, events);
  },
  getRegistrations(): Registration[] {
    return read<Registration[]>(KEYS.registrations, []);
  },
  saveRegistrations(regs: Registration[]): void {
    write(KEYS.registrations, regs);
  },
  getTeams(): Team[] {
    return read<Team[]>(KEYS.teams, []);
  },
  saveTeams(teams: Team[]): void {
    write(KEYS.teams, teams);
  },
  getAccounts(): Account[] {
    return read<Account[]>(KEYS.accounts, []);
  },
  saveAccounts(accounts: Account[]): void {
    write(KEYS.accounts, accounts);
  },
  getSession(): string | null {
    return read<string | null>(KEYS.session, null);
  },
  setSession(userId: string | null): void {
    write(KEYS.session, userId);
  },
  getAnnouncements(): Announcement[] {
    return read<Announcement[]>(KEYS.announcements, []);
  },
  saveAnnouncements(announcements: Announcement[]): void {
    write(KEYS.announcements, announcements);
  },
  getQuestions(): EventQuestion[] {
    return read<EventQuestion[]>(KEYS.questions, []);
  },
  saveQuestions(questions: EventQuestion[]): void {
    write(KEYS.questions, questions);
  },
  getWinners(): EventWinner[] {
    return read<EventWinner[]>(KEYS.winners, []);
  },
  saveWinners(winners: EventWinner[]): void {
    write(KEYS.winners, winners);
  },
};

export type { Account as DemoAccount };

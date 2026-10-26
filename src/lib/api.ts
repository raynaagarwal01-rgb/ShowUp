// Every call the React app makes to the ShowUp API (server/). The browser
// never talks to MySQL — it only sends HTTP requests here, and the server runs
// the SQL. The only thing kept in the browser is the login token.
import type {
  Announcement,
  EventInput,
  EventQuestion,
  EventRecord,
  EventWinner,
  MyRegistration,
  Participant,
  Registration,
  Team,
  TeamDetails,
  User,
} from "../types";

export const TOKEN_KEY = "showup_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // storage unavailable (private mode etc.)
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable — the session just won't survive a reload
  }
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      data && typeof data.error === "string"
        ? data.error
        : res.status >= 500
          ? "The server is unavailable right now. Please try again in a moment."
          : `Request failed (${res.status}).`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

const get = <T>(path: string) => request<T>("GET", path);
const post = <T>(path: string, body: unknown = {}) => request<T>("POST", path, body);
const put = <T>(path: string, body: unknown) => request<T>("PUT", path, body);
const del = <T>(path: string) => request<T>("DELETE", path);

// --- Auth ---------------------------------------------------------------------------

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: User["role"];
  college?: string;
  reg_no?: string;
}

export const signup = (input: SignupInput) => post<{ token: string; user: User }>("/auth/signup", input);
export const login = (email: string, password: string) =>
  post<{ token: string; user: User }>("/auth/login", { email, password });
export const getMe = () => get<{ user: User }>("/auth/me");
export const logout = () => post<{ ok: true }>("/auth/logout");

// --- Events -------------------------------------------------------------------------

export const listEvents = () => get<EventRecord[]>("/events");
export const createEvent = (input: EventInput) => post<EventRecord>("/events", input);
export const updateEvent = (id: number, input: EventInput) => put<EventRecord>(`/events/${id}`, input);
export const deleteEvent = (id: number) => del<{ ok: true }>(`/events/${id}`);

/** Returns null instead of throwing when the event doesn't exist. */
export async function getEvent(id: number | string): Promise<EventRecord | null> {
  try {
    return await get<EventRecord>(`/events/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

// --- Registrations ------------------------------------------------------------------

export const registerSolo = (eventId: number) => post<Registration>(`/events/${eventId}/register`);
export const listMyRegistrations = () => get<MyRegistration[]>("/my-registrations");
export const cancelRegistration = (id: number) => del<{ ok: true }>(`/registrations/${id}`);
export const listParticipants = (eventId: number) => get<Participant[]>(`/events/${eventId}/registrations`);
export const checkIn = (registrationId: number, eventId: number) =>
  post<{ ok: true; name: string }>(`/registrations/${registrationId}/check-in`, { event_id: eventId });

// --- Teams --------------------------------------------------------------------------

export const createTeam = (eventId: number, name: string) =>
  post<{ team: Team; registration: Registration }>(`/events/${eventId}/teams`, { name });
export const joinTeam = (joinCode: string) =>
  post<{ team: Team; registration: Registration }>("/teams/join", { join_code: joinCode });
export const getTeam = (teamId: number) => get<TeamDetails>(`/teams/${teamId}`);

// --- Announcements, questions, winners ------------------------------------------------

export const listAnnouncements = (eventId: number) => get<Announcement[]>(`/events/${eventId}/announcements`);
export const createAnnouncement = (eventId: number, title: string, content: string) =>
  post<Announcement>(`/events/${eventId}/announcements`, { title, content });

export const listQuestions = (eventId: number) => get<EventQuestion[]>(`/events/${eventId}/questions`);
export const askQuestion = (eventId: number, question: string) =>
  post<EventQuestion>(`/events/${eventId}/questions`, { question });
export const answerQuestion = (questionId: number, answer: string) =>
  put<{ ok: true }>(`/questions/${questionId}/answer`, { answer });

export const listWinners = (eventId: number) => get<EventWinner[]>(`/events/${eventId}/winners`);
export const addWinner = (eventId: number, winner: { position: number; winner_name: string; prize: string }) =>
  post<EventWinner>(`/events/${eventId}/winners`, winner);

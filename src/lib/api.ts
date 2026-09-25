// Thin fetch wrapper for the ShowUp API (server/). Everything the app stores
// lives in MySQL behind that API; the only thing kept in the browser is the
// login token.

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

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

/** Path segments are user/database ids — always encode them. */
export const seg = (value: string): string => encodeURIComponent(value);

export async function api<T>(path: string, { method = "GET", body }: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
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

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : res.status >= 500
          ? "The server is unavailable right now. Please try again in a moment."
          : `Request failed (${res.status}).`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

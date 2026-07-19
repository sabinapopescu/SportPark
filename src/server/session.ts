import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

const SESSION_COOKIE = "sp_admin_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function setSessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
  setResponseHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; HttpOnly; ${secure}SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  );
}

export function clearSessionCookie() {
  setResponseHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

export function readSessionToken(): string | null {
  const header = getRequestHeader("cookie");
  if (!header) return null;
  for (const part of header.split(/;\s*/)) {
    // Split only on the FIRST '=' — token values are opaque random strings but this stays safe either way.
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq) === SESSION_COOKIE) return part.slice(eq + 1);
  }
  return null;
}

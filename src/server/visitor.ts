import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import crypto from "node:crypto";

// Identifies "this browser" for the public registration flow (distinct from
// the HttpOnly admin session cookie in ./session.ts) — lets us block a second
// active registration for the same event from the same browser, and lets a
// returning visitor see their existing registration without an account.
const VISITOR_COOKIE = "sp_visitor";
const VISITOR_TTL_MS = 1000 * 60 * 60 * 24 * 365 * 2; // 2 years

function readVisitorCookie(): string | null {
  const header = getRequestHeader("cookie");
  if (!header) return null;
  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq) === VISITOR_COOKIE) return part.slice(eq + 1);
  }
  return null;
}

// Read-only — used where we must not create a new identity just because
// someone loaded a page (e.g. checking "am I already registered?").
export function getVisitorId(): string | null {
  return readVisitorCookie();
}

// Read-or-create — used at the point of registering, where a new browser
// needs an id to be recorded against.
export function ensureVisitorId(): string {
  const existing = readVisitorCookie();
  if (existing) return existing;
  const id = crypto.randomBytes(16).toString("base64url");
  const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
  setResponseHeader(
    "Set-Cookie",
    `${VISITOR_COOKIE}=${id}; HttpOnly; ${secure}SameSite=Lax; Path=/; Max-Age=${Math.floor(VISITOR_TTL_MS / 1000)}`,
  );
  return id;
}

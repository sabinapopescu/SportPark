import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";

import { prisma } from "./db";
import { authMiddleware } from "./auth-middleware";
import { rateLimit } from "./rate-limit";
import { clearSessionCookie, readSessionToken, setSessionCookie, SESSION_TTL_MS } from "./session";

// Precomputed once so a nonexistent-user login takes the same time as a
// wrong-password one — no timing signal for account enumeration.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("dummy-password-for-constant-time-compare", 10);

function clientIp(): string {
  const request = getRequest();
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export const login = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().trim().email(), password: z.string().min(1) }))
  .handler(async ({ data }) => {
    if (!rateLimit(`login:${clientIp()}`, 5, 60_000)) {
      throw new Error("Prea multe încercări. Încearcă din nou peste un minut.");
    }

    const admin = await prisma.admin.findUnique({ where: { email: data.email.toLowerCase() } });
    const passwordMatches = await bcrypt.compare(
      data.password,
      admin?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    if (!admin || !passwordMatches) throw new Error("Email sau parolă incorectă.");

    // Rotate: destroy any existing sessions for this admin, then issue a fresh one.
    await prisma.session.deleteMany({ where: { adminId: admin.id } });
    const token = crypto.randomBytes(32).toString("base64url");
    await prisma.session.create({
      data: { token, adminId: admin.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });
    setSessionCookie(token);
    return { ok: true as const };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const token = readSessionToken();
  if (token) await prisma.session.deleteMany({ where: { token } });
  clearSessionCookie();
  return { ok: true as const };
});

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const token = readSessionToken();
  if (!token) return { authed: false as const };
  const session = await prisma.session.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
    include: { admin: true },
  });
  if (!session) return { authed: false as const };
  return { authed: true as const, email: session.admin.email };
});

// Re-exported so route guards can depend on the middleware without importing
// server-internal db/session modules directly.
export { authMiddleware };

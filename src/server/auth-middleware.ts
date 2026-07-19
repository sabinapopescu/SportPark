import { createMiddleware } from "@tanstack/react-start";
import { prisma } from "./db";
import { readSessionToken } from "./session";

// Protects the DATA boundary. Attach to every server function that reads or
// writes admin-only data — the /admin/* route guard is UX, not security.
export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const token = readSessionToken();
  const session = token
    ? await prisma.session.findFirst({
        where: { token, expiresAt: { gt: new Date() } },
        include: { admin: true },
      })
    : null;
  if (!session) throw new Error("Unauthorized");
  return next({ context: { admin: { id: session.admin.id, email: session.admin.email } } });
});

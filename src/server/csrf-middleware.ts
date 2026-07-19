import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

// SameSite=Lax on the session cookie blocks most cross-site CSRF, but not a
// POST launched from a sibling subdomain. Belt-and-suspenders: reject any
// mutating request whose Origin header doesn't match this app's own origin.
export const csrfMiddleware = createMiddleware().server(async ({ next }) => {
  const request = getRequest();
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    const appOrigin = process.env.APP_ORIGIN;
    if (appOrigin && (!origin || new URL(origin).origin !== appOrigin)) {
      throw new Error("Origin check failed.");
    }
  }
  return next();
});

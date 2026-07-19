import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";

import type { Lang } from "@/lib/types";

const LANG_COOKIE = "sp_lang";

function readLangCookie(): Lang {
  const header = getRequestHeader("cookie");
  if (header) {
    for (const part of header.split(/;\s*/)) {
      const eq = part.indexOf("=");
      if (eq === -1) continue;
      if (part.slice(0, eq) === LANG_COOKIE) {
        const value = part.slice(eq + 1);
        if (value === "ro" || value === "ru") return value;
      }
    }
  }
  return "ro";
}

export const getLanguage = createServerFn({ method: "GET" }).handler(async () => {
  return readLangCookie();
});

export const setLanguage = createServerFn({ method: "POST" })
  .validator(z.object({ lang: z.enum(["ro", "ru"]) }))
  .handler(async ({ data }) => {
    const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
    setResponseHeader(
      "Set-Cookie",
      `${LANG_COOKIE}=${data.lang}; ${secure}SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 365}`,
    );
    return { ok: true as const };
  });

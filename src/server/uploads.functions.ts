import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./auth-middleware";
import { saveUpload } from "./uploads";

export const uploadBannerImage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected FormData.");
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("Niciun fișier selectat.");
    return { file };
  })
  .handler(async ({ data }) => {
    return saveUpload(data.file);
  });

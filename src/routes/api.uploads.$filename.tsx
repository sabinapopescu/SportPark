import { createFileRoute } from "@tanstack/react-router";
import { readUpload } from "@/server/uploads";

export const Route = createFileRoute("/api/uploads/$filename")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const file = await readUpload(params.filename);
        if (!file) return new Response("Not found", { status: 404 });
        return new Response(new Uint8Array(file.bytes), {
          headers: {
            "Content-Type": file.mime,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});

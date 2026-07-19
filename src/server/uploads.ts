import fs from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";

// Banner image storage. On Netlify, functions have no persistent filesystem,
// so uploads go to Netlify Blobs there; locally (and on any non-Netlify host)
// they go to local disk. Callers only depend on saveUpload()/readUpload()
// returning a URL / bytes, not on the storage backend.
// `NETLIFY=true` is only reliably set at build time, not in the deployed
// function's runtime — so also detect the Lambda runtime directly (Netlify
// Functions run on AWS Lambda under the hood, which always sets these).
const useBlobs =
  process.env["NETLIFY"] === "true" ||
  !!process.env["AWS_LAMBDA_FUNCTION_NAME"] ||
  !!process.env["LAMBDA_TASK_ROOT"];
export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
const MAX_BYTES = 3 * 1024 * 1024;
// Raster formats every major browser can render inline via <img>. Deliberately
// excludes SVG (can embed <script>, and browsers execute it if the upload URL
// is ever opened directly rather than shown in an <img>) and HEIC/TIFF (safe,
// but Chrome/Firefox/Edge can't display them — the banner would just look broken).
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/bmp": ".bmp",
};
const MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(EXT_BY_MIME).map(([mime, ext]) => [ext, mime]),
);
// Exactly what saveUpload() generates: crypto.randomUUID() + a known extension.
const SAFE_FILENAME = /^[0-9a-f-]{36}\.(jpg|png|webp|gif|avif|bmp)$/;

export function assertUploadable(file: File) {
  if (!(file.type in EXT_BY_MIME)) {
    throw new Error("Fișierul trebuie să fie o imagine (JPEG, PNG, WEBP, GIF, AVIF sau BMP).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Imagine prea mare (max 3 MB).");
  }
}

export async function saveUpload(file: File): Promise<{ url: string }> {
  assertUploadable(file);
  const ext = EXT_BY_MIME[file.type];
  const filename = `${crypto.randomUUID()}${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  if (useBlobs) {
    await getStore("uploads").set(filename, arrayBuffer);
  } else {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(arrayBuffer));
  }
  return { url: `/api/uploads/${filename}` };
}

export async function readUpload(
  filename: string,
): Promise<{ bytes: Buffer; mime: string } | null> {
  if (!SAFE_FILENAME.test(filename)) return null;
  const ext = path.extname(filename);
  const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";
  if (useBlobs) {
    const data = await getStore("uploads").get(filename, { type: "arrayBuffer" });
    return data ? { bytes: Buffer.from(data), mime } : null;
  }
  try {
    const bytes = await fs.readFile(path.join(UPLOAD_DIR, filename));
    return { bytes, mime };
  } catch {
    return null;
  }
}

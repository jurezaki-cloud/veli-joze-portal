import { NextResponse } from "next/server";
import { readJson } from "./api-security";
import { MAX_UPLOAD, prepareGalleryImage } from "./gallery-image";
export const validId = (id: unknown): id is string => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export function privateJson(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } }); }
export async function readCommunityInput(req: Request) {
 if (req.headers.get("content-type")?.includes("application/json")) {
  const p = await readJson(req); if (!p.ok) return { response: p.response, data: null, image: null };
  return { response: null, data: p.body as Record<string, unknown>, image: null };
 }
 if (!req.headers.get("content-type")?.startsWith("multipart/form-data")) return { response: privateJson({ ok: false, message: "Uporabi obrazec ali JSON." }, 415), data: null, image: null };
 try {
  const reader = req.body?.getReader(); if (!reader) throw new Error("empty");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) { const part = await reader.read(); if (part.done) break; length += part.value.length; if (length > MAX_UPLOAD + 16384) { await reader.cancel(); return { response: privateJson({ ok: false, message: "Fotografija je lahko velika največ 5 MB." }, 413), data: null, image: null }; } chunks.push(part.value); }
  const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": req.headers.get("content-type")! } }).formData();
  const data: Record<string, unknown> = Object.fromEntries(form); const file = form.get("photo"); let image: Buffer | null = null;
  if (file instanceof File && file.size) {
   if (form.get("photoConsent") !== "yes") return { response: privateJson({ ok: false, message: "Potrdi dovoljenje za objavo fotografije." }, 400), data: null, image: null };
   image = (await prepareGalleryImage(new Uint8Array(await file.arrayBuffer()))).image;
  }
  return { response: null, data, image };
 } catch { return { response: privateJson({ ok: false, message: "Izberi veljavno fotografijo JPG, PNG ali WebP do 5 MB." }, 400), data: null, image: null }; }
}

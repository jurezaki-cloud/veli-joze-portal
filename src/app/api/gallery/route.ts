import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { requireMember } from "@/lib/auth-guard";
import { requireSameOrigin } from "@/lib/api-security";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_UPLOAD, prepareGalleryImage } from "@/lib/gallery-image";
export const dynamic = "force-dynamic";
export async function GET() {
 try {
  const r = await getDatabase().query("select id,title,width,height,created_at from gallery_photos where status='approved' order by created_at desc limit 100");
  return NextResponse.json({ ok: true, data: r.rows }, { headers: { "Cache-Control": "no-store" } });
 } catch { return NextResponse.json({ ok: false, message: "Galerije trenutno ni mogoče naložiti." }, { status: 503 }); }
}
export async function POST(req: Request) {
 const origin = requireSameOrigin(req); if (origin) return origin;
 const auth = await requireMember(req); if (auth.response) return auth.response;
 try {
  const limited = await rateLimit(req, `gallery-${auth.user!.id}`, 5, 3600000); if (limited) return limited;
  if (!req.headers.get("content-type")?.startsWith("multipart/form-data")) return NextResponse.json({ ok: false, message: "Uporabi obrazec za fotografije." }, { status: 415 });
  if (Number(req.headers.get("content-length")) > MAX_UPLOAD + 16384) return NextResponse.json({ ok: false, message: "Fotografija je prevelika." }, { status: 413 });
  // Limit the actual body as well, including requests without Content-Length.
  const reader = req.body?.getReader(); if (!reader) return NextResponse.json({ ok: false }, { status: 400 });
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) { const part = await reader.read(); if (part.done) break; length += part.value.length; if (length > MAX_UPLOAD + 16384) { await reader.cancel(); return NextResponse.json({ ok: false, message: "Fotografija je prevelika." }, { status: 413 }); } chunks.push(part.value); }
  const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": req.headers.get("content-type")! } }).formData();
  const title = String(form.get("title") || "").trim(); const file = form.get("photo");
  if (title.length < 3 || title.length > 120 || form.get("consent") !== "yes" || !(file instanceof File)) return NextResponse.json({ ok: false, message: "Dodaj naslov, fotografijo in dovoljenje za objavo." }, { status: 400 });
  let prepared;
  try { prepared = await prepareGalleryImage(new Uint8Array(await file.arrayBuffer())); } catch { return NextResponse.json({ ok: false, message: "Izberi veljavno fotografijo JPG, PNG ali WebP do 5 MB." }, { status: 400 }); }
  await getDatabase().query("insert into gallery_photos(id,author_id,title,image,width,height) values($1,$2,$3,$4,$5,$6)", [randomUUID(), auth.user!.id, title, prepared.image, prepared.width, prepared.height]);
  return NextResponse.json({ ok: true, message: "Fotografija je shranjena in čaka na moderatorsko odobritev." }, { status: 201 });
 } catch { return NextResponse.json({ ok: false, message: "Fotografije trenutno ni mogoče shraniti. Poskusi pozneje." }, { status: 503 }); }
}

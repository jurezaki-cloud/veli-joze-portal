import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { getSessionUser } from "@/lib/auth-guard";
export const dynamic = "force-dynamic";
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
 try {
  const user = await getSessionUser(req);
  const reviewer = user?.approved && ["admin", "moderator"].includes(user.role);
  const r = await getDatabase().query<{ image: Buffer }>("select image from gallery_photos where id=$1 and (status='approved' or (status='pending' and $2::boolean))", [id, Boolean(reviewer)]);
  if (!r.rows[0]) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(r.rows[0].image), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
 } catch { return NextResponse.json({ ok: false }, { status: 503 }); }
}

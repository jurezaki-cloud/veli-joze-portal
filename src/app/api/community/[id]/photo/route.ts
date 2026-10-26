import { requireMember } from "@/lib/auth-guard";
import { getDatabase } from "@/lib/database";
import { privateJson, validId } from "@/lib/community-security";
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
 const auth = await requireMember(req); if (auth.response) return auth.response;
 const { id } = await params; if (!validId(id)) return new Response(null, { status: 404 });
 try { const r = await getDatabase().query<{ image: Buffer }>("select p.image from community_posts p join members m on m.id=p.author_id where p.id=$1 and p.status!='archived' and m.approved=true and p.image is not null", [id]); if (!r.rows[0]) return new Response(null, { status: 404 }); return new Response(new Uint8Array(r.rows[0].image), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } }); } catch { return privateJson({ ok: false }, 503); }
}

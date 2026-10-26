import { randomUUID } from "node:crypto";
import { requireMember } from "@/lib/auth-guard";
import { getDatabase } from "@/lib/database";
import { cleanText, readJson, requireSameOrigin } from "@/lib/api-security";
import { privateJson, validId } from "@/lib/community-security";
import { rateLimit } from "@/lib/rate-limit";
export async function GET(req: Request) {
 const auth = await requireMember(req); if (auth.response) return auth.response;
 const id = new URL(req.url).searchParams.get("id"); if (!validId(id)) return privateJson({ ok: false }, 400);
 try { const rows = await getDatabase().query(`select r.id,r.body,r.created_at,coalesce(m.nickname,m.display_name) author_name from community_replies r join members m on m.id=r.author_id join community_posts p on p.id=r.post_id join members owner on owner.id=p.author_id where p.id=$1 and p.status!='archived' and owner.approved=true and m.approved=true order by r.created_at limit 100`, [id]); return privateJson({ ok: true, data: rows.rows }); } catch { return privateJson({ ok: false, message: "Odgovorov ni mogoče naložiti." }, 503); }
}
export async function POST(req: Request) {
 const origin = requireSameOrigin(req); if (origin) return origin;
 const auth = await requireMember(req); if (auth.response) return auth.response;
 const p = await readJson(req); if (!p.ok) return p.response; const body = cleanText(p.body.body, 1000);
 if (!validId(p.body.id) || body.length < 2) return privateJson({ ok: false, message: "Napiši odgovor (2–1000 znakov)." }, 400);
 try {
  const limited = await rateLimit(req, `community-reply-${auth.user!.id}`, 20, 60000); if (limited) return limited;
  const r = await getDatabase().query(`with target as (select p.id,p.author_id,p.board from community_posts p join members m on m.id=p.author_id where p.id=$1 and p.status='open' and m.approved=true), added as (insert into community_replies(id,post_id,author_id,body) select $2,id,$3,$4 from target returning id), notify as (insert into portal_notifications(id,member_id,category,title,href) select $5,t.author_id,'replies','Nov odgovor na tvojo objavo',case when t.board='help' then '/pomoc-sosedov' else '/izgubljeno-najdeno' end||'?post='||t.id::text||'#post-'||t.id::text from target t,added where t.author_id!=$3) select id from added`, [p.body.id, randomUUID(), auth.user!.id, body, randomUUID()]);
  return r.rows.length ? privateJson({ ok: true, message: "Odgovor je objavljen." }, 201) : privateJson({ ok: false, message: "Objava je zaprta ali ni več na voljo." }, 409);
 } catch { return privateJson({ ok: false, message: "Odgovora ni mogoče shraniti." }, 503); }
}

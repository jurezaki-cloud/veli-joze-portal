import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { readJson, requireSameOrigin } from "@/lib/api-security";
import { getDatabase } from "@/lib/database";
export async function GET(req: Request) {
 const auth = await requireRole(req, ["moderator", "admin"]); if (auth.response) return auth.response;
 try { const r = await getDatabase().query("select p.id,p.title,p.width,p.height,p.created_at,m.nickname from gallery_photos p join members m on m.id=p.author_id where p.status='pending' order by p.created_at limit 100"); return NextResponse.json({ ok: true, data: r.rows }, { headers: { "Cache-Control": "no-store" } }); }
 catch { return NextResponse.json({ ok: false, message: "Fotografij v pregledu ni mogoče naložiti." }, { status: 503 }); }
}
export async function PATCH(req: Request) {
 const origin = requireSameOrigin(req); if (origin) return origin;
 const auth = await requireRole(req, ["moderator", "admin"]); if (auth.response) return auth.response;
 const parsed = await readJson(req); if (!parsed.ok) return parsed.response;
 const { id, status } = parsed.body;
 if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id) || !["approved", "rejected"].includes(status)) return NextResponse.json({ ok: false }, { status: 400 });
 try {
  const r = await getDatabase().query(`with changed as (
   update gallery_photos set status=$2,reviewed_by=$3,reviewed_at=now() where id=$1 and status='pending' returning id,status
  ), audit as (
   insert into moderation_actions(id,moderator_id,target_type,target_id,action) select $4,$3,'photo',id,$2 from changed
  ) select id,status from changed`, [id, status, auth.user!.id, randomUUID()]);
  if (!r.rows.length) return NextResponse.json({ ok: false, message: "Fotografija ni več v čakalni vrsti." }, { status: 409 });
  return NextResponse.json({ ok: true, message: status === "approved" ? "Fotografija je objavljena." : "Fotografija je zavrnjena." });
 } catch { return NextResponse.json({ ok: false, message: "Odločitve ni mogoče shraniti." }, { status: 503 }); }
}

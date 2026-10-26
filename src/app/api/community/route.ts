import { randomUUID } from "node:crypto";
import { requireMember } from "@/lib/auth-guard";
import { getDatabase } from "@/lib/database";
import { cleanText, readJson, requireSameOrigin } from "@/lib/api-security";
import { privateJson, readCommunityInput, validId } from "@/lib/community-security";
import { rateLimit } from "@/lib/rate-limit";
export async function GET(req: Request) {
 const auth = await requireMember(req); if (auth.response) return auth.response;
 const params=new URL(req.url).searchParams,board=params.get("board"),id=params.get("id");if(id!==null&&!validId(id))return privateJson({ok:false,message:"Neveljavna objava."},400); if (!["lost-found", "help"].includes(board || "")) return privateJson({ ok: false, message: "Neveljaven razdelek." }, 400);
 try {
  const rows = await getDatabase().query(`select p.id,p.board,p.kind,p.title,p.description,p.location,p.status,p.created_at,(p.image is not null) has_photo,coalesce(m.nickname,m.display_name) author_name,(p.author_id=$2::uuid) is_mine,
  (select count(*)::int from community_replies where post_id=p.id) reply_count,(select count(*)::int from community_likes where post_id=p.id) like_count,exists(select 1 from community_likes where post_id=p.id and member_id=$2) liked,exists(select 1 from community_follows where post_id=p.id and member_id=$2) followed from community_posts p join members m on m.id=p.author_id where p.board=$1 and p.status!='archived' and m.approved=true and ($3::uuid is null or p.id=$3) order by p.created_at desc limit 100`, [board, auth.user!.id,id]);
  return privateJson({ ok: true, data: rows.rows, canModerate: ["moderator", "admin"].includes(auth.user!.role) });
 } catch { return privateJson({ ok: false, message: "Objav trenutno ni mogoče naložiti." }, 503); }
}
export async function POST(req: Request) {
 const origin = requireSameOrigin(req); if (origin) return origin;
 const auth = await requireMember(req); if (auth.response) return auth.response;
 try {
  const limited = await rateLimit(req, `community-create-${auth.user!.id}`, 10, 3600000); if (limited) return limited;
  const input = await readCommunityInput(req); if (input.response) return input.response;
  const p = input.data!, board = cleanText(p.board, 20), kind = cleanText(p.kind, 20), title = cleanText(p.title, 120), description = cleanText(p.description, 2500), location = cleanText(p.location, 120);
  if (!(board === "lost-found" && ["lost", "found"].includes(kind) || board === "help" && ["need", "offer"].includes(kind)) || title.length < 3 || description.length < 10 || !location) return privateJson({ ok: false, message: "Dopolni vrsto objave, naslov, lokacijo in opis." }, 400);
  const id = randomUUID(); await getDatabase().query("insert into community_posts(id,author_id,board,kind,title,description,location,image) values($1,$2,$3,$4,$5,$6,$7,$8)", [id, auth.user!.id, board, kind, title, description, location, input.image]);
  return privateJson({ ok: true, id, message: "Objava je vidna odobrenim članom skupnosti." }, 201);
 } catch { return privateJson({ ok: false, message: "Objave trenutno ni mogoče shraniti." }, 503); }
}
export async function PATCH(req: Request) {
 const origin = requireSameOrigin(req); if (origin) return origin;
 const auth = await requireMember(req); if (auth.response) return auth.response;
 const p = await readJson(req); if (!p.ok) return p.response;
 if (!validId(p.body.id) || !["resolved", "open", "archived"].includes(p.body.status)) return privateJson({ ok: false, message: "Neveljavna sprememba." }, 400);
 try {
  const limited = await rateLimit(req, `community-update-${auth.user!.id}`, 30, 60000); if (limited) return limited;
  const moderator = ["moderator", "admin"].includes(auth.user!.role);
  const rows = await getDatabase().query(`with changed as (update community_posts set status=$2,updated_at=now() where id=$1 and status!='archived' and (author_id=$3 or $4::boolean) returning id), audit as (insert into moderation_actions(id,moderator_id,target_type,target_id,action) select $5,$3,'community_post',id,$2 from changed) select id from changed`, [p.body.id, p.body.status, auth.user!.id, moderator, randomUUID()]);
  if (!rows.rows.length) return privateJson({ ok: false, message: "Objava ne obstaja ali za spremembo nimaš dovoljenja." }, 404);
  return privateJson({ ok: true, message: p.body.status === "resolved" ? "Objava je označena kot rešena." : p.body.status === "archived" ? "Objava je umaknjena." : "Objava je ponovno odprta." });
 } catch { return privateJson({ ok: false, message: "Spremembe ni mogoče shraniti." }, 503); }
}

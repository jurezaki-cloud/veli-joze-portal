import {NextResponse} from "next/server";
import {requireMember} from "@/lib/auth-guard";
import {getDatabase} from "@/lib/database";
import type {UnreadMessage} from "@/lib/message-alerts";

export async function GET(req: Request) {
  const auth = await requireMember(req);
  if (auth.response) return auth.response;
  const headers = {"cache-control": "private, no-store"};
  try {
    const result = await getDatabase().query<{unread:number;latest:UnreadMessage[]}>(`
      select (select count(*)::int from direct_messages
        where recipient_id=$1 and read_at is null and hidden_at is null) unread,
      coalesce((select json_agg(recent) from (
        select d.id,d.sender_id,coalesce(nullif(m.nickname,''),m.display_name) sender_name,d.created_at
        from direct_messages d join members m on m.id=d.sender_id
        where d.recipient_id=$1 and d.read_at is null and d.hidden_at is null
        order by d.created_at desc,d.id desc limit 20
      ) recent),'[]'::json) latest`, [auth.user!.id]);
    return NextResponse.json({ok:true,ownId:auth.user!.id,...result.rows[0]}, {headers});
  } catch {
    return NextResponse.json({ok:false,message:"Obvestil o sporočilih trenutno ni mogoče naložiti."}, {status:503,headers});
  }
}

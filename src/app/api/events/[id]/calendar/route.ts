import { getDatabase } from "@/lib/database";
import { validId } from "@/lib/community-security";
const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
function fold(line: string) { let out="", chunk=""; for(const char of line){ if(Buffer.byteLength(chunk+char)>73){out+=chunk+"\r\n ";chunk="";} chunk+=char; }return out+chunk; }
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
 const { id } = await params; if (!validId(id)) return new Response(null, { status: 404 });
 try {
  const r = await getDatabase().query<{ title:string;location:string;description:string;start_at:Date|string }>("select title,location,description,(event_date+event_time) at time zone 'Europe/Zagreb' start_at from events where id=$1 and archived_at is null", [id]);
  if (!r.rows[0]) return new Response(null, { status: 404 }); const e=r.rows[0]; const stamp=(date:Date)=>date.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//JU-TAN studio//Veli Joze//SL","CALSCALE:GREGORIAN","BEGIN:VEVENT",`UID:${id}@veli-joze.eu`,`DTSTAMP:${stamp(new Date())}`,`DTSTART:${stamp(new Date(e.start_at))}`,`SUMMARY:${escape(e.title)}`,`LOCATION:${escape(e.location)}`,`DESCRIPTION:${escape(e.description)}`,`URL:https://www.veli-joze.eu/dogodki#event-${id}`,"BEGIN:VALARM","TRIGGER:-PT1H","ACTION:DISPLAY","DESCRIPTION:Opomnik na dogodek Veli Joze","END:VALARM","END:VEVENT","END:VCALENDAR"];
  return new Response(lines.map(fold).join("\r\n")+"\r\n", { headers: { "Content-Type":"text/calendar; charset=utf-8","Content-Disposition":`attachment; filename="veli-joze-${id}.ics"`,"Cache-Control":"no-store" } });
 } catch { return new Response("Koledarja trenutno ni mogoče pripraviti.",{status:503}); }
}

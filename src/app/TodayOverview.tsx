import Link from "next/link";
import Icon from "./Icon";
import AnnouncementTitle from "./AnnouncementTitle";
import NewSinceLastVisit from "./NewSinceLastVisit";
import PersonalOverview from "./PersonalOverview";
import type {HomeData} from "@/lib/home-data";
export default function TodayOverview({home,member}:{home:HomeData|null;member:boolean}){
 const now=new Date();
 const isoDate=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Ljubljana",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
 const date=new Intl.DateTimeFormat("sl-SI",{timeZone:"Europe/Ljubljana",weekday:"long",day:"numeric",month:"long"}).format(now);
 return <section className="todayOverview" aria-labelledby="today-title">
  <div className="feedHeading"><div><span className="eyebrow">POVEZANI VSE LETO</span><h2 id="today-title">Danes v Velem Jožetu</h2></div><time dateTime={isoDate}>{date}</time></div>
  {home?<>{home.announcements.length?<div className="todayNotices">{home.announcements.map(notice=><Link key={notice.id} href="/obvestila"><Icon name="bell"/><span><AnnouncementTitle title={notice.title}/></span><span aria-hidden="true">→</span></Link>)}</div>:<p className="todayEmpty"><Icon name="bell"/>Trenutno ni aktualnih obvestil. <Link href="/obvestila">Vsa obvestila →</Link></p>}</>:<p role="status">Dnevni pregled trenutno ni dosegljiv. <Link href="/obvestila">Odpri obvestila →</Link></p>}
  {member?<><PersonalOverview/><NewSinceLastVisit/></>:<p className="todayJoin"><Link href="/prijava">Prijavi se</Link> za osebni pregled sporočil, prijav na dogodke in novosti od zadnjega obiska.</p>}
 </section>;
}

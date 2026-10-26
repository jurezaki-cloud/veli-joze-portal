import {cache} from "react";
import {notFound} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Section from "../../Section";
import EventParticipation,{EventParticipationProvider} from "../../EventParticipation";
import {publicEvent} from "@/lib/public-content";
import {detailMetadata,detailSchema,jsonLd} from "@/lib/seo";
import {formatCampDate} from "@/lib/camp-date";
export const dynamic="force-dynamic";
const readEvent=cache(publicEvent);
type Props={params:Promise<{id:string}>};
export async function generateMetadata({params}:Props){const {id}=await params;const event=await readEvent(id);if(!event)notFound();return detailMetadata(`/dogodki/${event.id}`,`${event.title} – ${formatCampDate(event.event_date)}`,event.description)}
export default async function Page({params}:Props){const {id}=await params;const event=await readEvent(id);if(!event)notFound();return <><nav className="seoBreadcrumb" aria-label="Pot po strani"><Link href="/">Portal</Link><span aria-hidden="true">›</span><Link href="/dogodki">Dogodki</Link><span aria-hidden="true">›</span><span>{event.title}</span></nav><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(detailSchema(`/dogodki/${event.id}`,event.title,event.description,"dogodki"))}}/><Section title={event.title}><article className="publicDetail"><p><time dateTime={event.event_date}>{formatCampDate(event.event_date,"long")}</time> · {event.event_time.slice(0,5)} (Europe/Zagreb)</p><p><strong>Lokacija:</strong> {event.location}</p>{event.cover_photo_id&&<Image unoptimized src={`/api/gallery/${event.cover_photo_id}`} alt={`Fotografija dogodka: ${event.title}`} width={960} height={540}/>}<p className="publicDetailText">{event.description}</p><EventParticipationProvider><EventParticipation id={event.id} title={event.title}/></EventParticipationProvider><p><Link href={`/dogodki#event-${event.id}`}>Odpri dogodek v koledarju in seznamu →</Link></p><p className="sourceNotice">Javna objava skupnosti. Za spremembe termina in dodatne informacije spremljaj to objavo.</p></article></Section></>}

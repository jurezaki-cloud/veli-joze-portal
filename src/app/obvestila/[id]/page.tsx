import {cache} from "react";
import {notFound} from "next/navigation";
import Link from "next/link";
import Section from "../../Section";
import {publicAnnouncement} from "@/lib/public-content";
import {detailMetadata,detailSchema,jsonLd} from "@/lib/seo";
import {formatCampDate} from "@/lib/camp-date";
export const dynamic="force-dynamic";
const readNotice=cache(publicAnnouncement);
type Props={params:Promise<{id:string}>};
export async function generateMetadata({params}:Props){const {id}=await params;const notice=await readNotice(id);if(!notice)notFound();return detailMetadata(`/obvestila/${notice.id}`,notice.title,notice.content)}
export default async function Page({params}:Props){const {id}=await params;const notice=await readNotice(id);if(!notice)notFound();return <><nav className="seoBreadcrumb" aria-label="Pot po strani"><Link href="/">Portal</Link><span aria-hidden="true">›</span><Link href="/obvestila">Obvestila</Link><span aria-hidden="true">›</span><span>{notice.title}</span></nav><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(detailSchema(`/obvestila/${notice.id}`,notice.title,notice.content,"obvestila"))}}/><Section title={notice.title}><article className="publicDetail"><p>{notice.type} · Objavljeno <time dateTime={notice.published_at}>{formatCampDate(notice.published_at,"long")}</time></p><p className="publicDetailText">{notice.content}</p><p><Link href={`/obvestila#notice-${notice.id}`}>Vsa javna obvestila →</Link></p><p className="sourceNotice">Javna objava skupnosti portala Veli Jože.</p></article></Section></>}

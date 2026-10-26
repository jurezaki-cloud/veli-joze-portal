import type {MetadataRoute} from "next";
import {publicPages,siteUrl} from "@/lib/seo";
import {publicEvents,publicAnnouncements} from "@/lib/public-content";
export const dynamic="force-dynamic";
/** A failed database read must not advertise an incomplete sitemap as successful. */
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const [events,notices]=await Promise.all([publicEvents(),publicAnnouncements()]);
 const pages:MetadataRoute.Sitemap=Object.keys(publicPages).map(path=>({url:siteUrl+(path==="/"?"/":"/"+path),changeFrequency:path==="/"?"weekly":"monthly",priority:path==="/"?1:0.6}));
 return [...pages,...events.map(item=>({url:siteUrl+"/dogodki/"+item.id})),...notices.map(item=>({url:siteUrl+"/obvestila/"+item.id}))];
}

import PublicPageSeo from "../PublicPageSeo";
import AnnouncementsClient from "./AnnouncementsClient";
import {publicAnnouncements} from "@/lib/public-content";
export const dynamic="force-dynamic";
export default async function Page(){const items=await publicAnnouncements().catch(()=>null);return <><PublicPageSeo path="obvestila"/><AnnouncementsClient initialItems={items}/></>;}

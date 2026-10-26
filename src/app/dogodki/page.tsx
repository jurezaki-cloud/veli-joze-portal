import PublicPageSeo from "../PublicPageSeo";
import EventsClient from "./EventsClient";
import {publicEvents} from "@/lib/public-content";
export const dynamic="force-dynamic";
export default async function Page(){const items=await publicEvents().catch(()=>null);return <><PublicPageSeo path="dogodki"/><EventsClient initialItems={items}/></>;}

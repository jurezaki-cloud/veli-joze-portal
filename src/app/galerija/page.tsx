import GalleryClient from "./GalleryClient";
import {publicGalleryPhotos} from "@/lib/public-content";
export const dynamic="force-dynamic";
export default async function Page(){const items=await publicGalleryPhotos().catch(()=>null);return <GalleryClient initialItems={items}/>}

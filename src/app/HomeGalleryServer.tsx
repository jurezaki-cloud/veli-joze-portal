import {publicGalleryPhotos} from "@/lib/public-content";
import HomeGallery from "./HomeGallery";
export default async function HomeGalleryServer(){const photos=await publicGalleryPhotos().catch(()=>null);return <HomeGallery initialItems={photos?.slice(0,4)??null}/>}

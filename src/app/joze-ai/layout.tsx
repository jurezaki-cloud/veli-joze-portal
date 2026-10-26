import {pageMetadata} from "@/lib/seo";
import PublicPageSeo from "../PublicPageSeo";
export const metadata=pageMetadata("joze-ai");
export default function Layout({children}:{children:React.ReactNode}){return <><PublicPageSeo path="joze-ai"/>{children}</>}

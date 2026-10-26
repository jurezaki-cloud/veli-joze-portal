import {pageMetadata} from "@/lib/seo";
import PublicPageSeo from "../PublicPageSeo";
export const metadata=pageMetadata("galerija");
export default function Layout({children}:{children:React.ReactNode}){return <><PublicPageSeo path="galerija"/>{children}</>}

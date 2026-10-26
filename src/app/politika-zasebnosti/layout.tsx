import {pageMetadata} from "@/lib/seo";
import PublicPageSeo from "../PublicPageSeo";
export const metadata=pageMetadata("politika-zasebnosti");
export default function Layout({children}:{children:React.ReactNode}){return <><PublicPageSeo path="politika-zasebnosti"/>{children}</>}

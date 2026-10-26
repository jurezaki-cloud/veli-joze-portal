import {pageMetadata} from "@/lib/seo";
import PublicPageSeo from "../PublicPageSeo";
export const metadata=pageMetadata("kam-danes");
export default function Layout({children}:{children:React.ReactNode}){return <><PublicPageSeo path="kam-danes"/>{children}</>}

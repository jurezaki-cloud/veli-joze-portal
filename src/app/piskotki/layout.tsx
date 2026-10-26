import {pageMetadata} from "@/lib/seo";
import PublicPageSeo from "../PublicPageSeo";
export const metadata=pageMetadata("piskotki");
export default function Layout({children}:{children:React.ReactNode}){return <><PublicPageSeo path="piskotki"/>{children}</>}

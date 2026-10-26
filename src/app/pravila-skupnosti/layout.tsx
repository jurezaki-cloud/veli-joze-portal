import {pageMetadata} from "@/lib/seo";
import PublicPageSeo from "../PublicPageSeo";
export const metadata=pageMetadata("pravila-skupnosti");
export default function Layout({children}:{children:React.ReactNode}){return <><PublicPageSeo path="pravila-skupnosti"/>{children}</>}

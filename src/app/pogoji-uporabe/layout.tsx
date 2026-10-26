import {pageMetadata} from "@/lib/seo";
import PublicPageSeo from "../PublicPageSeo";
export const metadata=pageMetadata("pogoji-uporabe");
export default function Layout({children}:{children:React.ReactNode}){return <><PublicPageSeo path="pogoji-uporabe"/>{children}</>}

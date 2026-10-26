import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_ORIGIN } from "../lib/seo";
import PwaRegister from "./PwaRegister";
const geistSans=Geist({variable:"--font-geist-sans",subsets:["latin"]});
const geistMono=Geist_Mono({variable:"--font-geist-mono",subsets:["latin"]});
export const metadata:Metadata={
 metadataBase:new URL(SITE_ORIGIN),
 title:{default:"Veli Jože | Portal pavšalistov",template:"%s | Veli Jože"},
 description:"Neuradni portal skupnosti pavšalistov Kampa Veli Jože",
 manifest:"/manifest.webmanifest",
 applicationName:"Veli Jože",
 appleWebApp:{capable:true,title:"Veli Jože",statusBarStyle:"default"},
 openGraph:{type:"website",locale:"sl_SI",siteName:"Veli Jože",title:"Veli Jože | Portal pavšalistov",description:"Neuradni portal skupnosti pavšalistov Kampa Veli Jože"}
};
export const viewport:Viewport={themeColor:"#0875a7"};
export default function RootLayout({children}:LayoutProps<"/">){return <html lang="sl" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}><body className="min-h-full flex flex-col"><PwaRegister/>{children}</body></html>}

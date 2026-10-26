import {pageMetadata,jsonLd,websiteSchema,organizationSchema} from "@/lib/seo";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./portal.css";
import MessageStorageEvents from "./MessageStorageEvents";
import CookieNotice from "./CookieNotice";
import PrivacyFooter from "./PrivacyFooter";
import PwaRegister from "./PwaRegister";
import MobileNavigation from "./MobileNavigation";
import NotificationIndicator from "./NotificationIndicator";
const geistSans=Geist({variable:"--font-geist-sans",subsets:["latin"]});
const geistMono=Geist_Mono({variable:"--font-geist-mono",subsets:["latin"]});
export const metadata:Metadata={
 ...pageMetadata("/"),
 metadataBase:new URL("https://www.veli-joze.eu"),
 title:{default:"Veli Jože Savudrija | Portal pavšalistov",template:"%s | Veli Jože"},
 manifest:"/veli-manifest-1.14.1.json",
 applicationName:"Veli Jože",
 icons:{icon:[{url:"/icons/veli-joze-v108-192.png",type:"image/png"}],apple:[{url:"/icons/veli-joze-v108-apple.png",sizes:"180x180",type:"image/png"}]},
 appleWebApp:{capable:true,title:"Veli Jože",statusBarStyle:"default"},

};
export const viewport:Viewport={themeColor:"#073654"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="sl" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}><body className="min-h-full flex flex-col"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd([websiteSchema(),organizationSchema()])}}/><PwaRegister><MessageStorageEvents/><MobileNavigation/><NotificationIndicator/>{children}<PrivacyFooter/><CookieNotice/></PwaRegister></body></html>}

import Image from "next/image";
export default function AnnouncementTitle({title}:{title:string}){
 const normalized=title.toLocaleLowerCase("sl-SI").replace(/\s+/g,"");
 const waterNotice=normalized.includes("prekinitevoskrbezvodo")&&normalized.includes("rumeniconi")&&/04[.]10[.]2026/.test(normalized);
 return <>{title}{waterNotice&&<picture className="noticeWaterIcon"><source media="(prefers-reduced-motion: reduce)" srcSet="/water-outage-static.png"/><Image src="/water-outage.gif" alt="Prekinjena oskrba z vodo" width={44} height={44} unoptimized /></picture>}</>;
}

import {Suspense} from "react";
import WeatherSummaryServer from "./WeatherSummaryServer";
import HomeGalleryServer from "./HomeGalleryServer";
import {formatCampDate} from "@/lib/camp-date";
import HomeRefresh from "./HomeRefresh";
import PollFeed from "./PollFeed";
import HomeInstall from "./HomeInstall";
import HomeGallery from "./HomeGallery";
import TodayOverview from "./TodayOverview";

import HomeChatPreview from "./HomeChatPreview";
import {cookies} from "next/headers";
import {getSessionUser} from "@/lib/auth-guard";
import {getPortalRepository} from "@/lib/repository";
import AccountActions from "./AccountActions";
import {pageMetadata,pageSchema,jsonLd} from "@/lib/seo";
import Link from "next/link";
import Image from "next/image";
import Icon from "./Icon";
import WeatherSummary from "./WeatherSummary";
import {loadHome} from "@/lib/home-data";
export const metadata={...pageMetadata("/"),title:{absolute:"Veli Jože Savudrija | Portal pavšalistov"}};
export const dynamic="force-dynamic";
const shortcuts=[["chat","Klepet","Poveži se s sosedi","/klepet"],["calendar","Dogodki","Srečanja in druženje","/dogodki"],["market","Mali oglasi","Najdi, kupi ali prodaj","/oglasi"],["map","Zemljevid","Vse na enem mestu","/zemljevid"]];
function countLabel(n:number,one:string,two:string,few:string,many:string){const remainder=n%100;return remainder===1?one:remainder===2?two:remainder===3||remainder===4?few:many;}
export default async function Home(){
 const cookieStore=await cookies();
 const identity=await getSessionUser(new Request("https://www.veli-joze.eu/",{headers:{cookie:cookieStore.toString()}})).catch(()=>null);
 const [home,member]=await Promise.all([loadHome(identity?.id).catch(()=>null),identity?getPortalRepository().getMember(identity.id).catch(()=>null):Promise.resolve(null)]);
 const date=(value:string)=>formatCampDate(value,"short");
 const nextEvent=home?.events[0];
 return <main className="portalHome" id="main-content">
  <HomeRefresh/>
  <header className="portalTop"><div><span className="eyebrow">SAVUDRIJA · ISTRA</span><p>Dobrodošli v naši skupnosti.</p></div><AccountActions member={member}/></header>
  <section className="portalHero" aria-labelledby="welcome-title"><picture className="heroBackdrop"><source media="(max-width: 800px)" srcSet="/hero-seo-1.14.0-800.webp 800w, /hero-seo-1.14.0-1280.webp 1280w" sizes="100vw"/><Image src="/hero-seo-1.14.0-1600.webp" alt="" width={1600} height={900} priority unoptimized/></picture><div className="heroCopy"><span className="heroTag">PORTAL PAVŠALISTOV</span><h1 id="welcome-title">Veli Jože.<br/><span>Tvoj kotiček ob morju.</span></h1><p>Neuradni portal pavšalistov kampa Veli Jože v Savudriji.<br/>Informacije, druženje in ideje za raziskovanje Istre.</p><div className="heroLinks"><Link href={member?.approved?"/moj-portal":identity?"/profil":"/registracija"}>{member?.approved?"Odpri Moj portal":identity?"Odpri svoj profil":"Pridruži se skupnosti"} <span>↗</span></Link><Link href="/kam-danes">Razišči okolico →</Link></div></div><div className="heroSpotlight"><span className="spotlightLabel"><Icon name="calendar"/>{nextEvent?"NASLEDNJE DRUŽENJE":"POLETNI DUH, VSE LETO"}</span>{nextEvent?<>{nextEvent.cover_photo_id&&<Image className="spotlightCover" unoptimized src={`/api/gallery/${nextEvent.cover_photo_id}`} alt={`Fotografija dogodka: ${nextEvent.title}`} width={480} height={240}/>}<span className="spotlightDate">{date(nextEvent.event_date)} <small>{nextEvent.event_time.slice(0,5)}</small></span><h2>{nextEvent.title}</h2><p>{nextEvent.location}</p><Link href={`/dogodki/${nextEvent.id}`}>Poglej dogodek <span>↗</span></Link></>:<><h2>Najlepše je<br/>v dobri družbi.</h2><p>Spoznaj sosede in načrtuj naslednje srečanje.</p><Link href="/klepet">Pridruži se pogovoru ↗</Link></>}<small className="spotlightPlace">VELI JOŽE · SAVUDRIJA</small></div></section>
  {member?.approved&&<section className="homeMemberEntry" aria-label="Tvoj Moj portal"><div><span className="eyebrow">DOBRODOŠEL NAZAJ</span><h2>Tvoj prostor v skupnosti.</h2><p>Prijavljeni dogodki, shranjeni oglasi, spremljane teme in tvoje novosti.</p></div><Link href="/moj-portal">Odpri Moj portal <span aria-hidden="true">→</span></Link></section>}
  <section className="portalOverview" aria-label="Pregled kampa"><Suspense fallback={<WeatherSummary/>}><WeatherSummaryServer/></Suspense><article><Icon name="users"/><div><b>{home?home.members:"—"}</b><small>{home?countLabel(home.members,"član skupnosti","člana skupnosti","člani skupnosti","članov skupnosti"):"članov skupnosti"}</small></div></article><article><Icon name="calendar"/><div><b>{home?home.eventsCount:"—"}</b><small>{home?countLabel(home.eventsCount,"prihajajoči dogodek","prihajajoča dogodka","prihajajoči dogodki","prihajajočih dogodkov"):"prihajajočih dogodkov"}</small></div></article><Link href="/moja-obvestila" className="overviewLink"><Icon name="bell"/><div><b>Moja obvestila</b><small>{home&&home.unreadCount>0?home.unreadCount+" neprebranih":"Tvoj osebni pregled"}</small></div><span>↗</span></Link></section>
  <div className="homeSectionIntro"><div><span className="eyebrow">DOBER DAN SE ZAČNE TUKAJ</span><h2>Kaj bomo danes?</h2></div><span>Pogovor. Druženje. Nova ideja.</span></div>
  <nav className="portalShortcuts" aria-label="Hitre povezave">{shortcuts.map(([icon,label,desc,href])=><Link href={href} key={href}><span className="shortcutIcon"><Icon name={icon}/></span><div><b>{label}</b><small>{desc}</small></div><span>↗</span></Link>)}</nav>
  <form className="homePortalSearch" action="/iskanje" method="get" role="search"><label htmlFor="home-search"><Icon name="search"/><span>Poišči na portalu</span></label><div><input id="home-search" type="search" name="q" required minLength={2} maxLength={80} placeholder="Obvestilo, dogodek, oglas …"/><button>Poišči →</button></div></form>
  <TodayOverview home={home} member={member?.approved===true}/>
  <section className="portalDiscover"><article className="discoveryCard"><Link href="/kam-danes#konobe" className="discoverPhoto"><span className="eyebrow">OKUSI ISTRE</span><h2>Dan za<br/>nekaj dobrega.</h2><p>Odkrij predloge konob in restavracij za naslednje druženje.</p><span className="discoverCta">Poišči idejo za kosilo ↗</span></Link><nav className="discoverCategories" aria-label="Ideje za današnji dan"><Link href="/kam-danes#plaze"><Icon name="waves"/>Plaže</Link><Link href="/kam-danes#konobe"><Icon name="heart"/>Kulinarika</Link><Link href="/kam-danes#izleti"><Icon name="pin"/>Izleti</Link></nav></article><div className="communityCard"><span className="eyebrow">MED SOSEDI</span><HomeChatPreview canRead={identity?.approved===true}/></div><div className="joskoCard"><span className="joskoBadge"><Icon name="bot"/></span><span className="eyebrow">TVOJ POMOČNIK</span><h2>Vprašaj JOŠKA.</h2><p>Iščeš informacijo o kampu? Začni tukaj.</p>{["Kdaj je odprta recepcija?","Kje najdem koristne kontakte?"].map(x=><Link href={`/joze-ai?q=${encodeURIComponent(x)}`} key={x}>{x} ↗</Link>)}<Link className="joskoCta" href="/joze-ai">Odpri pomočnika →</Link></div></section>
  {member?.approved&&<PollFeed compact/>}
  <section className="homeSeoIntro"><h2>Pavšalisti Veli Jože v Savudriji</h2><p>Neuradni portal naše skupnosti povezuje sosede in zbere uporabne informacije za bivanje v kampu. Razišči javne vsebine in načrtuj naslednji dan ob morju.</p><nav aria-label="Informacije o Velem Jožetu"><Link href="/informacije">Informacije o kampu →</Link><Link href="/obvestila">Javna obvestila →</Link><Link href="/dogodki">Prihajajoči dogodki →</Link><Link href="/kam-danes">Ideje za izlete →</Link></nav></section><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd([pageSchema("/")])}}/>{!identity&&<section className="homeJoinCard" aria-labelledby="join-title"><div><span className="eyebrow">DOBRI SOSEDJE, NA ENEM MESTU</span><h2 id="join-title">Tvoja skupnost tudi med obiski.</h2><p>Spoznaj sosede, dogovori se za druženje in ostani na tekočem.</p><ul><li>Klepet in zasebna sporočila</li><li>Prijave na dogodke in osebna obvestila</li><li>Mali oglasi in fotografije skupnosti</li></ul><p className="joinApproval">Po registraciji potrdi e-pošto. Članski dostop odobri moderator.</p><div className="joinActions"><Link href="/registracija">Ustvari račun →</Link><Link href="/prijava">Že imaš račun? Prijava</Link></div></div><div className="joinVisual" aria-hidden="true"><Icon name="users"/><strong>Povezani<br/>ob morju.</strong><span>VELI JOŽE · SAVUDRIJA</span></div></section>}<HomeInstall/>
  <Suspense fallback={<HomeGallery/>}><HomeGalleryServer/></Suspense>
  <section className="portalUtility"><Link href="/tezave"><Icon name="alert"/><span><b>Nekaj ne deluje?</b><small>Prijavi težavo v kampu.</small></span>→</Link><Link href="/sos"><Icon name="heart"/><span><b>Kontakti in pomoč</b><small>Koristne številke na enem mestu.</small></span>→</Link><Link href="/galerija"><Icon name="image"/><span><b>Naši spomini</b><small>Fotografije skupnosti.</small></span>→</Link></section>
 </main>
}
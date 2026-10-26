"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
const VERSION="2026-10-09-v2";
export default function CookieNotice(){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{const timer=setTimeout(()=>setVisible(!document.cookie.split(";").some(c=>c.trim()===`vj_cookie_notice=${VERSION}`)),0);const open=()=>setVisible(true);window.addEventListener("vj-cookie-settings",open);return()=>{clearTimeout(timer);window.removeEventListener("vj-cookie-settings",open)}},[]);
 function dismiss(){document.cookie=`vj_cookie_notice=${VERSION}; Max-Age=15552000; Path=/; SameSite=Lax${location.protocol==="https:"?"; Secure":""}`;setVisible(false)}
 function reset(){document.cookie="vj_cookie_notice=; Max-Age=0; Path=/; SameSite=Lax";setVisible(true)}
 if(!visible)return null;
 return <section className="cookieNotice" role="region" aria-label="Obvestilo o nujnih piškotkih"><div><strong>Tvoja zasebnost je pomembna.</strong><p>Uporabljamo samo nujne piškotke za prijavo in prikaz tega obvestila ter lokalno shrambo za osnutke, varne ponovne poskuse in osveževanje zavihkov. Analitika in oglaševalsko sledenje nista vključena.</p><Link href="/piskotki">Podrobnosti o piškotkih</Link> · <Link href="/politika-zasebnosti">Politika zasebnosti</Link></div><div className="cookieActions"><button type="button" onClick={dismiss}>Razumem</button><button type="button" onClick={reset}>Ponastavi obvestilo</button></div></section>
}

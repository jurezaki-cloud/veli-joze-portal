"use client";
import {zoneLabel} from "@/lib/zones";

import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import Section from "../Section";
import {api} from "@/lib/client-api";
type Item={id:string;title?:string;board?:string;category?:string;location?:string;status?:string;event_date?:string;event_time?:string};
type Dashboard={member:{nickname:string;display_name:string;zone:string;parcel_private:string};posts:Item[];listings:Item[];reports:Item[];events:Item[]};
const statuses:Record<string,string>={open:"Prejeto / aktivno",resolved:"Rešeno",reviewing:"V obravnavi",closed:"Rešeno",pending:"Čaka na pregled",approved:"Objavljeno",rejected:"Zavrnjeno"};
export default function Page(){const [data,setData]=useState<Dashboard|null>(null),[error,setError]=useState("");const load=useCallback(async()=>{try{setData((await api<{data:Dashboard}>("/api/my-parcel")).data);setError("")}catch(e){setError(e instanceof Error?e.message:"Pregleda ni mogoče naložiti.")}},[]);useEffect(()=>{const t=setTimeout(()=>void load(),0);return()=>clearTimeout(t)},[load]);
 return <Section title="Moja parcela">{error?<div className="featureError" role="alert"><p>{error}</p><Link href="/prijava">Prijava</Link><button onClick={()=>void load()}>Poskusi znova</button></div>:!data?<p role="status">Nalagam tvoj pregled …</p>:<><div className="parcelHero"><div><small>ZASEBNI PREGLED</small><h2>{data.member.nickname||data.member.display_name}</h2><p>Parcela <strong>{data.member.parcel_private}</strong>{data.member.zone&&<> · {zoneLabel(data.member.zone)}</>}</p></div><p>Ta pregled in številka parcele sta vidna samo tebi.</p></div><div className="featureQuickLinks"><Link href="/izgubljeno-najdeno">Izgubljeno / najdeno</Link><Link href="/pomoc-sosedov">Pomoč med sosedi</Link><Link href="/tezave">Prijavi težavo</Link><Link href="/moja-obvestila">Moja obvestila</Link></div><div className="parcelGrid">{[
 {title:"Moje objave",items:data.posts,href:(x:Item)=>x.board==="help"?"/pomoc-sosedov":"/izgubljeno-najdeno"},
 {title:"Moji mali oglasi",items:data.listings,href:()=>"/oglasi"},
 {title:"Moje prijave težav",items:data.reports,href:()=>"/tezave"},
 {title:"Dogodki, na katere sem prijavljen",items:data.events,href:()=>"/dogodki"}
 ].map(group=><section className="parcelPanel" key={group.title}><h3>{group.title} <span>({group.items.length})</span></h3>{group.items.length?group.items.map(x=><Link className="parcelRow" key={x.id} href={group.href(x)}><strong>{x.title||`${x.category} · ${x.location}`}</strong><small>{x.event_date?`${new Date(x.event_date).toLocaleDateString("sl-SI")} · ${x.event_time?.slice(0,5)}`:statuses[x.status||""]||x.status}</small></Link>):<p>Trenutno ni vnosov.</p>}</section>)}</div></>}</Section>;
}

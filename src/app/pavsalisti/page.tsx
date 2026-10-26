"use client";
import {readApiResponse} from "@/lib/client-api";
import Link from "next/link";
import {zones,zoneLabel} from "@/lib/zones";
import {useEffect,useMemo,useState} from "react";
import Section from "../Section";
import MemberAvatar from "../MemberAvatar";
type Member={id:string;displayName:string;nickname?:string;zone?:string;bio?:string;avatarUpdatedAt?:string};
export default function Page(){
 const [items,setItems]=useState<Member[]>([]),[query,setQuery]=useState(""),[zone,setZone]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0);
 useEffect(()=>{
  const c=new AbortController();
  void(async()=>{try{const r=await fetch("/api/members",{cache:"no-store",signal:c.signal}),d=await readApiResponse(r);if(!c.signal.aborted){setItems(d.data||[]);setError("")}}catch(e){if(!c.signal.aborted)setError(e instanceof Error?e.message:"Seznama ni mogoče naložiti.")}finally{if(!c.signal.aborted)setLoading(false)}})();
  return()=>c.abort();
 },[retry]);
 const shown=useMemo(()=>items.filter(x=>(x.nickname||x.displayName).toLocaleLowerCase("sl").includes(query.trim().toLocaleLowerCase("sl"))&&(!zone||x.zone===zone)),[items,query,zone]);
 return <Section title="Pavšalisti"><div className="membersHero"><div><span>SKUPNOST VELI JOŽE</span><h2>Naši pavšalisti</h2><p>Spoznaj sosede in ostani povezan s skupnostjo.</p></div><div className="membersCount"><b>{items.length}</b><small>odobrenih članov</small></div></div>{loading&&<p role="status">Nalagam člane …</p>}{error&&<p role="alert">{error} <button onClick={()=>{setLoading(true);setRetry(value=>value+1)}}>Poskusi znova</button></p>}<div className="memberTools"><input aria-label="Išči pavšalista" placeholder="Išči po imenu ali vzdevku …" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Filtriraj po coni" value={zone} onChange={e=>setZone(e.target.value)}><option value="">Vse cone</option>{zones.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></div><div className="membersGrid">{shown.map(x=><article className="memberCard" key={x.id}><MemberAvatar id={x.id} name={x.nickname||x.displayName} updated={x.avatarUpdatedAt} className="memberAvatar"/><div><h3>{x.nickname||x.displayName}</h3><p>{x.bio||"Član skupnosti"}</p><small>{x.zone?zoneLabel(x.zone):"Cona je zasebna"}</small><p><Link href={`/sporocila?peer=${x.id}`}>Pošlji sporočilo</Link></p></div></article>)}</div>{!loading&&!error&&shown.length===0&&<div className="membersEmpty"><b>Ni zadetkov</b><span>Poskusi drug vzdevek ali drugo cono.</span></div>}<div className="privacyStrip"><b>Zasebnost članov</b><span>Ta seznam je javen: prikazuje izbrano ime, opis in cono, če jo član dovoli. E-pošta in parcela ostajata zasebni; profilna fotografija je na voljo samo prijavljenim odobrenim članom.</span></div></Section>;
}

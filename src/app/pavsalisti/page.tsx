"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import Section from "../Section";
import {pavsalisti} from "@/data/portal";

export default function Page(){
 const [query,setQuery]=useState("");
 const [onlyOnline,setOnlyOnline]=useState(false);
 const online=pavsalisti.filter(x=>x.online).length;
 const shown=useMemo(()=>pavsalisti.filter(x=>{
  const matches=x.vzdevek.toLocaleLowerCase("sl").includes(query.trim().toLocaleLowerCase("sl"));
  return matches&&(!onlyOnline||x.online);
 }),[query,onlyOnline]);
 return <Section title="Pavšalisti">
  <div className="membersHero"><div><span>SKUPNOST VELI JOŽE</span><h2>Naši pavšalisti</h2><p>Spoznaj sosede, poišči družbo in ostani povezan s kampom.</p></div><div className="membersCount"><b>{online}</b><small>trenutno online</small></div></div>
  <div className="memberTools"><input aria-label="Išči pavšalista" placeholder="Išči po vzdevku …" value={query} onChange={e=>setQuery(e.target.value)}/><div className="memberFilters"><button className={!onlyOnline?"active":""} type="button" onClick={()=>setOnlyOnline(false)}>Vsi</button><button className={onlyOnline?"active":""} type="button" onClick={()=>setOnlyOnline(true)}>Online</button></div></div>
  <div className="membersGrid">{shown.map((x,i)=><article className="memberCard" key={x.id}><div className="memberAvatar">{x.vzdevek.slice(0,1).toUpperCase()}<i className={x.online?"online":"offline"}/></div><div><h3>{x.vzdevek}</h3><p>{x.online?"Aktiven v skupnosti":"Trenutno ni online"}</p><small>{x.cona?"Cona "+x.cona:"Cona je zasebna"}</small></div>{i===0?<Link className="memberProfileLink" href="/profil">Moj profil</Link>:<span className="pendingAction">Profil po priklopu</span>}</article>)}</div>
  {shown.length===0&&<div className="membersEmpty"><b>Ni zadetkov</b><span>Poskusi drug vzdevek ali izberi prikaz vseh članov.</span></div>}
  <div className="privacyStrip"><b>🔒 Zasebnost je na prvem mestu</b><span>Številka parcele in e-pošta nista nikoli prikazani javno. Cona je vidna samo, če jo član dovoli.</span></div>
  <small className="demoNote">DEMO člani · pravi seznam bo prikazan šele po varnem produkcijskem priklopu in odobritvi uporabnikov.</small>
 </Section>;
}
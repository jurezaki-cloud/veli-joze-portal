"use client";
import {readApiResponse} from "@/lib/client-api";
import {useEffect,useState} from "react";
import Link from "next/link";
const rooms=[["general","Splošno"],["social","Druženje"],["help","Pomoč"],["market","Kupim / prodam"],["lost-found","Izgubljeno / najdeno"]];
type Message={id:string;author:string;body:string};
function Preview({room,label,canRead}:{room:string;label:string;canRead:boolean}){
 const [items,setItems]=useState<Message[]>([]),[error,setError]=useState(""),[loaded,setLoaded]=useState(false);
 useEffect(()=>{if(!canRead)return;let stopped=false;let controller:AbortController|undefined;
  const load=async()=>{controller?.abort();const current=new AbortController();controller=current;try{const r=await fetch(`/api/chat?room=${room}`,{cache:"no-store",signal:current.signal});const j=await readApiResponse(r);if(stopped||current.signal.aborted)return;if(!r.ok)throw new Error(j.message||"Pogovora ni mogoče naložiti.");setItems((j.data||[]).slice(-3));setError("");setLoaded(true)}catch(e){if(stopped||current.signal.aborted)return;setError(e instanceof Error?e.message:"Pogovora ni mogoče naložiti.");setLoaded(true)}};
  const first=setTimeout(()=>void load(),0),timer=setInterval(()=>{if(!document.hidden)void load()},10000);const visible=()=>{if(!document.hidden)void load()};document.addEventListener("visibilitychange",visible);return()=>{stopped=true;controller?.abort();clearTimeout(first);clearInterval(timer);document.removeEventListener("visibilitychange",visible)};
 },[room,canRead]);
 return <div className="chat"><h3>👥 {label} <small>Klepet skupnosti</small></h3>{!canRead?<p>Za ogled pogovorov se prijavi z odobrenim članskim računom.</p>:error?<p role="alert">{error}</p>:!loaded?<p role="status">Nalagam pogovor …</p>:items.length?items.map(x=><p className="chatPreviewMessage" key={x.id}><b>{x.author}: </b>{x.body}</p>):<p>V tej sobi še ni sporočil.</p>}<Link className="aiAskLink" href={`/klepet?room=${room}`}>Odpri pogovor →</Link></div>;
}
export default function HomeChatPreview({canRead}:{canRead:boolean}){const [room,setRoom]=useState("general");return <><div className="rooms"><h3>💬 Klepet pavšalistov</h3>{rooms.map(([id,label])=><button type="button" key={id} aria-pressed={room===id} onClick={()=>setRoom(id)}>{label}</button>)}</div><Preview key={room} room={room} label={rooms.find(x=>x[0]===room)![1]} canRead={canRead}/></>}

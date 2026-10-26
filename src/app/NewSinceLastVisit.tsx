"use client";
import {publishPortalUpdate} from "@/lib/portal-updates";
import {readApiResponse,api,jsonOptions} from "@/lib/client-api";
import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
type Item={label:string;count:number;href:string};
type Overview={data:Item[];since:string;asOf:string;firstVisit:boolean};
export default function NewSinceLastVisit({onReviewed}:{onReviewed?:()=>void}){
 const [data,setData]=useState<Overview|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState("");const request=useRef<AbortController|null>(null);
 const load=useCallback(async()=>{request.current?.abort();const controller=new AbortController();request.current=controller;setLoading(true);setError("");try{const r=await fetch("/api/new-since",{cache:"no-store",signal:controller.signal}),j=await readApiResponse(r);if(!controller.signal.aborted)setData(j)}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Novosti niso dosegljive.")}finally{if(!controller.signal.aborted)setLoading(false)}},[]);
 useEffect(()=>{const timer=setTimeout(()=>void load(),0);return()=>{clearTimeout(timer);request.current?.abort()}},[load]);
 async function reviewed(){if(!data)return;setBusy(true);setMessage("");try{const j=await api<{message:string}>("/api/new-since",jsonOptions({asOf:data.asOf}));setMessage(j.message);await load();onReviewed?.();publishPortalUpdate("portal-visit-reviewed")}catch(e){setMessage(e instanceof Error?e.message:"Oznake ni mogoče shraniti.")}finally{setBusy(false)}}
 const total=data?.data.reduce((n,x)=>n+x.count,0)||0;
 return <section className="panel v41New visitOverview" aria-label="Novosti od zadnjega pregleda"><div className="visitHeading"><div><h3>Novo od zadnjega pregleda <b>{total}</b></h3>{data&&<p>{data.firstVisit?"Prvi pregled: novosti zadnjih 30 dni.":`Od ${new Date(data.since).toLocaleString("sl-SI",{timeZone:"Europe/Zagreb"})}`}</p>}</div><Link href="/moj-portal">Moj portal →</Link></div>{loading&&<p role="status">Nalagam novosti …</p>}{error&&<p role="alert">{error} <button disabled={loading||busy} onClick={()=>void load()}>Poskusi znova</button></p>}{data&&!loading&&!error&&<><div className="v41NewGrid">{data.data.map(x=><Link href={x.href} key={x.label}><strong>{x.count}</strong><span>{x.label}</span></Link>)}</div><div className="visitActions"><p>Novosti ostanejo označene, dokler ne potrdiš pregleda. Neodprta sporočila ostanejo neprebrana.</p><button disabled={busy||total===0} onClick={()=>void reviewed()}>{busy?"Shranjujem …":"Označi pregledano"}</button></div></>}{message&&<p role="status">{message}</p>}</section>
}

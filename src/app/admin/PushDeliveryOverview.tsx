"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {api,jsonOptions} from "@/lib/client-api";
import type {PushDeliveryCounts} from "@/lib/push-delivery-overview";
type Overview={configured:boolean;data:PushDeliveryCounts};
export default function PushDeliveryOverview(){
 const [view,setView]=useState<Overview|null>(null),[error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const request=useRef<AbortController|null>(null),lock=useRef(false);
 const load=useCallback(async()=>{request.current?.abort();const controller=new AbortController();request.current=controller;try{const data=await api<Overview>("/api/admin/push",{signal:controller.signal});if(!controller.signal.aborted){setView(data);setError("")}}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Pregled ni dosegljiv.")}},[]);
 useEffect(()=>{const timer=setTimeout(()=>void load(),0);return()=>{clearTimeout(timer);request.current?.abort()}},[load]);
 async function retry(){if(lock.current)return;lock.current=true;setBusy(true);setMessage("");setError("");try{const result=await api<{message:string}>("/api/admin/push",jsonOptions({action:"retry-exhausted"}));setMessage(result.message);await load()}catch(e){setError(e instanceof Error?e.message:"Ukrep ni uspel.")}finally{lock.current=false;setBusy(false)}}
 return <section className="parcelPanel" aria-label="Dostava obvestil push"><h2>Dostava obvestil push</h2><p>Pregled že zabeleženih dostav za odobrene, neblokirane člane. Nove dostave se pojavijo po obdelavi delavca.</p>{error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}{view?<><p>{view.configured?"Push je nastavljen; uspešnost preveri s testnim obvestilom na svoji napravi.":"Push še ni nastavljen. Uporabi priložena navodila PUSH-NASTAVITVE.txt."}</p><dl><dt>Nedostavljeno, manj kot 3 poskusi</dt><dd>{view.data.waiting}</dd><dt>Vsi 3 poskusi porabljeni</dt><dd>{view.data.exhausted}</dd><dt>Uspešno dostavljeno</dt><dd>{view.data.sent}</dd></dl><p>Po odpravi težave lahko izčrpane dostave vrneš v obdelavo, ko je od zadnjega poskusa minilo vsaj 5 minut. Že dostavljene ostanejo nedotaknjene.</p><div className="featureActions"><button disabled={busy} onClick={()=>void load()}>Osveži pregled</button><button disabled={busy||!view.configured||view.data.exhausted===0} onClick={()=>void retry()}>{busy?"Pripravljam …":"Vrni izčrpane dostave v obdelavo"}</button></div></>:<p role="status">{error?"Pregled ni na voljo.":"Nalagam dostave …"}</p>}</section>;
}

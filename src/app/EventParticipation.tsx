"use client";
import {publishPortalUpdate} from "@/lib/portal-updates";
import {createContext,useCallback,useContext,useEffect,useRef,useState,ReactNode} from "react";
import {readApiResponse,api,jsonOptions} from "@/lib/client-api";
type RSVP={id:string;going_count:number;going:boolean};
type Person={id:string;name:string};
type State={items:RSVP[];error:string;loading:boolean;needsLogin:boolean;refresh:()=>Promise<void>};
const Context=createContext<State>({items:[],error:"",loading:true,needsLogin:false,refresh:async()=>{}});
export function EventParticipationProvider({children}:{children:ReactNode}){
 const [items,setItems]=useState<RSVP[]>([]),[error,setError]=useState(""),[loading,setLoading]=useState(true),[needsLogin,setNeedsLogin]=useState(false);
 const request=useRef<AbortController|null>(null);
 const refresh=useCallback(async()=>{
  request.current?.abort();const controller=new AbortController();request.current=controller;setLoading(true);
  try{const response=await fetch("/api/event-rsvps",{cache:"no-store",signal:controller.signal});if(controller.signal.aborted)return;const login=response.status===401||response.status===403;setNeedsLogin(login);if(login)setItems([]);const j=await readApiResponse(response);if(controller.signal.aborted)return;setItems(j.data||[]);setError("")}
  catch(e){if(controller.signal.aborted)return;setError(e instanceof Error?e.message:"Prijave niso dosegljive.")}
  finally{if(!controller.signal.aborted)setLoading(false)}
 },[]);
 useEffect(()=>{const changed=()=>{if(document.hidden)return;void refresh()};const visible=()=>{if(!document.hidden){void refresh()}};const timer=setTimeout(()=>void refresh(),0);window.addEventListener("portal-notifications-change",changed);document.addEventListener("visibilitychange",visible);window.addEventListener("online",changed);return()=>{clearTimeout(timer);request.current?.abort();window.removeEventListener("portal-notifications-change",changed);document.removeEventListener("visibilitychange",visible);window.removeEventListener("online",changed)}},[refresh]);
 return <Context.Provider value={{items,error,loading,needsLogin,refresh}}>{children}</Context.Provider>
}
export function MyEventsToggle({children}:{children:(ids:Set<string>,state:{loading:boolean;error:string;needsLogin:boolean})=>ReactNode}){
 const {items,error,loading,needsLogin,refresh}=useContext(Context);
 return <>{loading&&<p role="status">Preverjam tvoje prijave …</p>}{error&&<p role="status">{error} {needsLogin?<a href="/prijava">Odpri prijavo</a>:<button onClick={()=>void refresh()}>Poskusi znova</button>}</p>}{children(new Set(items.filter(x=>x.going).map(x=>x.id)),{loading,error,needsLogin})}</>
}
export default function EventParticipation({id,title}:{id:string;title?:string}){
 const {items,error,loading,needsLogin,refresh}=useContext(Context),item=items.find(x=>x.id===id);
 const [message,setMessage]=useState(""),[busy,setBusy]=useState(false),[peopleResult,setPeople]=useState<{data:Person[];snapshot:RSVP[]}|null>(null),[peopleLoading,setPeopleLoading]=useState(false),[shareUrl,setShareUrl]=useState("");
 const people=item&&!needsLogin&&!loading&&!error&&peopleResult?.snapshot===items?peopleResult.data:null;
 const peopleRequest=useRef<AbortController|null>(null),mutation=useRef(false);
 useEffect(()=>()=>peopleRequest.current?.abort(),[]);
 async function toggle(){if(mutation.current||loading||error||!item)return;mutation.current=true;setBusy(true);setMessage("");try{const j=await api<{message:string}>("/api/event-rsvps",jsonOptions({id,going:!item?.going}));setMessage(j.message);peopleRequest.current?.abort();setPeople(null);setPeopleLoading(false);await refresh();publishPortalUpdate()}catch(e){setMessage(e instanceof Error?e.message:"Prijava ni uspela.")}finally{mutation.current=false;setBusy(false)}}
 async function attendees(){
  if(people!==null){setPeople(null);return}
  const controller=new AbortController();peopleRequest.current?.abort();peopleRequest.current=controller;setPeopleLoading(true);setMessage("");
  try{const j=await api<{data:Person[]}>(`/api/event-rsvps?event=${id}`,{signal:controller.signal});if(!controller.signal.aborted)setPeople({data:j.data,snapshot:items})}catch(e){if(!controller.signal.aborted)setMessage(e instanceof Error?e.message:"Seznama ni mogoče naložiti.")}finally{if(!controller.signal.aborted)setPeopleLoading(false)}
 }
 async function share(){
  const url=`${location.origin}/dogodki/${id}`,text=title?`${title} · Veli Jože`:"Dogodek Veli Jože";setMessage("");
  if(navigator.share){try{await navigator.share({title:text,text,url});return}catch(e){if(e instanceof Error&&e.name==="AbortError")return}}
  try{await navigator.clipboard.writeText(url);setShareUrl("");setMessage("Povezava do dogodka je kopirana.")}catch{setShareUrl(url);setMessage("Kopiraj spodnjo povezavo do dogodka.")}
 }
 return <div className="eventParticipation">{item&&<><span className={item.going?"eventGoing":""}>{item.going_count} prijavljenih{item.going?" · ✓ Prijavljen si":""}</span><button disabled={busy||loading||Boolean(error)} onClick={()=>void toggle()}>{busy?"Shranjujem …":item.going?"Prekliči prijavo":"Pridem"}</button><button disabled={busy||loading||Boolean(error)||peopleLoading} aria-expanded={people!==null} aria-controls={`attendees-${id}`} onClick={()=>void attendees()}>{peopleLoading?"Nalagam …":people!==null?"Zapri seznam":"Kdo pride?"}</button></>}
 <button onClick={()=>void share()}>Deli dogodek</button><a href={`/api/events/${id}/calendar`}>Dodaj v koledar · opomnik</a>
 {people!==null&&<div id={`attendees-${id}`} className="eventAttendees"><strong>Prijavljeni člani</strong><small>Prikazana so javna imena iz profilov. Tvoja prijava je vidna odobrenim članom.</small>{people.length?<ul>{people.map(p=><li key={p.id}>{p.name}</li>)}</ul>:<small>Še ni prijavljenih.</small>}</div>}
 {item&&!loading&&!error&&!needsLogin&&peopleResult&&peopleResult.snapshot!==items&&<small role="status">Za svež seznam ponovno izberi »Kdo pride?«.</small>}
 {item&&!item.going&&<small>Ob prijavi bo tvoje javno ime vidno odobrenim članom.</small>}
 {error&&needsLogin&&<a href="/prijava">Prijava za udeležbo</a>}
 {message&&<small role="status">{message}</small>}{shareUrl&&<label className="eventShareLink">Povezava<input readOnly value={shareUrl} onFocus={e=>e.currentTarget.select()}/></label>}</div>
}

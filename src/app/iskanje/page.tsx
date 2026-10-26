"use client";
import LoadingCard from "../LoadingCard";
import Link from "next/link";
import {FormEvent,useEffect,useRef,useState} from "react";
import Section from "../Section";
import Icon from "../Icon";
import {readApiResponse} from "@/lib/client-api";
import {searchCategories,SearchCategory,SearchResult,searchExcerpt} from "@/lib/portal-search";
import {isPastAnnouncement} from "@/lib/announcement-status";
type SearchState={query:string;category:SearchCategory;page:number};
const statusLabels:Record<string,string>={active:"Na voljo",reserved:"Rezervirano",sold:"Prodano",open:"Aktivno",resolved:"Rešeno"};
function ResultCard({item,query}:{item:SearchResult;query:string}){
 const label=searchCategories.find(x=>x.value===item.kind)?.label||"Objava",past=item.kind==="announcement"&&isPastAnnouncement({title:item.title});
 return <article className="searchResult"><div className="searchResultMeta"><span>{label}</span>{item.status&&<span>{statusLabels[item.status]||item.status}</span>}{past&&<span>Preteklo opozorilo</span>}</div><h2>{item.title}</h2><p className="searchResultDetail">{item.detail}</p><p className="searchResultExcerpt">{searchExcerpt(item.body,query)}</p><div className="searchResultActions"><details><summary>Preberi celotno objavo</summary><p className="searchFullText">{item.body}</p></details><Link href={item.href}>Odpri razdelek →</Link></div></article>
}
export default function Page(){
 const [input,setInput]=useState(""),[search,setSearch]=useState<SearchState|null>(null),[items,setItems]=useState<SearchResult[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState(""),[needsLogin,setNeedsLogin]=useState(false),[hasMore,setHasMore]=useState(false),[retry,setRetry]=useState(0);
 const request=useRef<AbortController|null>(null),results=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{const timer=setTimeout(()=>{const params=new URLSearchParams(location.search),query=params.get("q")||"",category=params.get("category")||"all";if(query.trim().length>=2&&query.length<=80){setInput(query);setSearch({query,category:searchCategories.some(x=>x.value===category)?category as SearchCategory:"all",page:0})}},0);return()=>clearTimeout(timer)},[]);
 useEffect(()=>{
  if(!search)return;const controller=new AbortController();request.current?.abort();request.current=controller;
  const timer=setTimeout(()=>{setLoading(true);setError("");setItems([]);setHasMore(false);void(async()=>{
   try{const response=await fetch(`/api/search?${new URLSearchParams({q:search.query,category:search.category,page:String(search.page)})}`,{cache:"no-store",signal:controller.signal});if(controller.signal.aborted)return;setNeedsLogin(response.status===401||response.status===403);const data=await readApiResponse(response);if(controller.signal.aborted)return;setItems(data.data||[]);setHasMore(data.hasMore===true)}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Iskanje ni uspelo.")}finally{if(!controller.signal.aborted)setLoading(false)}
  })()},0);
  return()=>{clearTimeout(timer);controller.abort()};
 },[search,retry]);
 function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const query=input.trim().replace(/\s+/g," ");if(query.length<2){setError("Vnesi vsaj 2 znaka.");return}request.current?.abort();setSearch({query,category:search?.category||"all",page:0});setLoading(true);setItems([]);setError("");setHasMore(false);history.replaceState(null,"",`/iskanje?${new URLSearchParams({q:query,category:search?.category||"all"})}`)}
 function change(category:SearchCategory,page=0){if(!search)return;request.current?.abort();setLoading(true);setItems([]);setError("");setHasMore(false);setSearch({...search,category,page});history.replaceState(null,"",`/iskanje?${new URLSearchParams({q:search.query,category})}`);if(page)results.current?.scrollIntoView({block:"start",behavior:"smooth"})}
 return <Section title="Iskanje po portalu"><div className="portalSearchIntro"><span className="searchEmblem"><Icon name="search"/></span><div><h2>Najdi, kar iščeš.</h2><p>Obvestila, prihajajoči dogodki, odobreni oglasi in objave skupnosti na enem mestu.</p></div></div>
 <form className="portalSearchForm" role="search" onSubmit={submit}><label htmlFor="portal-search">Kaj iščeš?</label><div><input id="portal-search" name="q" type="search" value={input} onChange={e=>setInput(e.target.value)} required minLength={2} maxLength={80} placeholder="Npr. voda, kolo, izgubljeni ključi …"/><button type="submit">Poišči <Icon name="search"/></button></div></form>
 <p className="featureHint">Iskanje je na voljo odobrenim članom. Deluje tudi brez šumnikov; pri več besedah išče vse vnesene besede.</p>
 <div className="searchFilters" aria-label="Filtri iskanja">{searchCategories.map(x=><button key={x.value} disabled={!search} aria-pressed={(search?.category||"all")===x.value} onClick={()=>change(x.value)}>{x.label}</button>)}</div>
 <div ref={results} className="searchResults" aria-busy={loading}>{loading?<LoadingCard label="Iščem …"/>:error?<div className="searchEmpty" role="alert"><h2>{needsLogin?"Za iskanje se prijavi":"Iskanje ni uspelo"}</h2><p>{error}</p>{needsLogin?<Link href="/prijava">Odpri prijavo →</Link>:search&&<button onClick={()=>setRetry(x=>x+1)}>Poskusi znova</button>}</div>:search?<><p className="searchSummary" role="status">{items.length?`Rezultati za »${search.query}« · stran ${search.page+1}`:`Za »${search.query}« ni zadetkov.`}</p>{items.map(x=><ResultCard key={`${x.kind}-${x.id}`} item={x} query={search.query}/>)}{!items.length&&<div className="searchEmpty"><h2>Poskusi z drugo besedo</h2><p>Uporabi krajši izraz ali izberi filter Vse. Preveri na primer »ključi« namesto »izgubljeni ključi«.</p></div>}<div className="searchPagination">{search.page>0&&<button onClick={()=>change(search.category,search.page-1)}>← Prejšnja stran</button>}{hasMore&&<button onClick={()=>change(search.category,search.page+1)}>Naslednja stran →</button>}</div></>:<div className="searchEmpty"><h2>Eno iskanje, več razdelkov</h2><p>Vnesi besedo ali kraj, nato zoži rezultate s filtrom.</p></div>}</div></Section>
}

"use client";
import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";
import Icon from "./Icon";
import {useEffect,useRef,useState} from "react";
const groups=[
 {title:"SKUPNOST",items:[["home","Pregled","/"],["search","Iskanje","/iskanje"],["bell","Obvestila","/obvestila"],["chat","Klepet","/klepet"],["calendar","Dogodki","/dogodki"],["market","Mali oglasi","/oglasi"],["image","Galerija","/galerija"],["users","Ankete","/ankete"]]},
 {title:"ŽIVLJENJE V KAMPU",items:[["cloud","Vreme in morje","/vreme"],["map","Zemljevid kampa","/zemljevid"],["pin","Kam danes?","/kam-danes"],["info","Informacije","/informacije"],["heart","Pomoč med sosedi","/pomoc-sosedov"],["search","Izgubljeno / najdeno","/izgubljeno-najdeno"]]},
 {title:"MOJ PORTAL",items:[["home","Moj portal","/moj-portal"],["users","Moj profil","/profil"],["users","Moja parcela","/moja-parcela"],["bell","Moja obvestila","/moja-obvestila"],["chat","Zasebna sporočila","/sporocila"],["users","Pavšalisti","/pavsalisti"],["bot","JOŠKO AI","/joze-ai"],["alert","Prijavi težavo","/tezave"],["heart","SOS / Kontakti","/sos"],["info","Namesti aplikacijo","/namestitev"]]}
];
const shortcuts=[["home","Domov","/"],["chat","Klepet","/klepet"],["bell","Obvestila","/moja-obvestila"],["market","Oglasi","/oglasi"],["users","Moj portal","/moj-portal"]];
export default function MobileNavigation(){
 const dialog=useRef<HTMLDialogElement|null>(null),trigger=useRef<HTMLButtonElement|null>(null),filterInput=useRef<HTMLInputElement|null>(null),previousOverflow=useRef<string|null>(null);
 const [menuOpen,setMenuOpen]=useState(false),[filter,setFilter]=useState("");
 const restoreScroll=()=>{if(previousOverflow.current!==null){document.body.style.overflow=previousOverflow.current;previousOverflow.current=null}};
 function openMenu(){setFilter("");if(!dialog.current||dialog.current.open)return;previousOverflow.current=document.body.style.overflow;document.body.style.overflow="hidden";dialog.current.showModal();setMenuOpen(true);filterInput.current?.focus()}
 function closeMenu(){dialog.current?.close()}
 const pathname=usePathname();
 useEffect(()=>{dialog.current?.close()},[pathname]);
 useEffect(()=>()=>{if(previousOverflow.current!==null)document.body.style.overflow=previousOverflow.current},[]);
const active=(href:string)=>pathname===href||(href!=="/"&&pathname.startsWith(href+"/"));
 const links=groups.map((group,index)=>{const items=group.items.map(([icon,label,href])=><Link key={href} href={href} aria-current={active(href)?"page":undefined} onClick={event=>event.currentTarget.closest("details")?.removeAttribute("open")}><Icon name={icon}/><span>{label}</span></Link>);return index===0?<div className="railGroup" key={group.title}><span>{group.title}</span>{items}</div>:<details className="railGroup railDisclosure" key={group.title} open={group.items.some(([, ,href])=>active(href))}><summary>{group.title}<span aria-hidden="true">⌄</span></summary>{items}</details>});
 const brand=<Link href="/" className="portalBrand"><Image src="/veli-logo-seo-1.14.0.png" alt="" width={68} height={68} priority unoptimized/><span><b>VELI JOŽE</b><small>SKUPNOST · SAVUDRIJA</small></span></Link>;
 const normalized=(value:string)=>value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 const filtered=groups.map(group=>({...group,items:group.items.filter(([,label])=>normalized(label).includes(normalized(filter.trim())))})).filter(group=>group.items.length);
 return <><a className="skipLink" href="#main-content">Preskoči na vsebino</a><aside className="portalRail">{brand}<nav aria-label="Glavna navigacija">{links}</nav><p className="railNote">Neuradni portal pavšalistov<br/><b>Povezani tudi izven sezone.</b></p></aside>
 <div className="phoneHeader">{brand}<div className="phoneHeaderActions"><Link href="/iskanje" className="phoneSearch" aria-label="Iskanje po portalu"><Icon name="search"/></Link><button ref={trigger} className="phoneMenuButton" aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="portal-menu" onClick={openMenu}><Icon name="menu"/><span>Meni</span></button></div></div>
 <dialog ref={dialog} id="portal-menu" className="portalMenuDialog" aria-labelledby="portal-menu-title" onClose={()=>{setMenuOpen(false);restoreScroll();trigger.current?.focus()}} onClick={event=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeMenu()}}}>
 <div className="portalMenuHeading"><div><small>VELI JOŽE · SAVUDRIJA</small><h2 id="portal-menu-title">Kam želiš?</h2></div><button type="button" aria-label="Zapri meni" onClick={closeMenu}><Icon name="close"/></button></div>
 <label className="portalMenuFilter">Poišči razdelek<input ref={filterInput} type="search" value={filter} onChange={event=>setFilter(event.target.value)} placeholder="Npr. oglasi, vreme, moj portal …"/></label>
 <nav aria-label="Vsi razdelki" className="portalMenuSections">{filtered.map(group=><section key={group.title}><h3>{group.title}</h3><div>{group.items.map(([icon,label,href])=><Link key={href} href={href} aria-current={active(href)?"page":undefined} onClick={closeMenu}><Icon name={icon}/><span>{label}</span><span aria-hidden="true">↗</span></Link>)}</div></section>)}</nav>{!filtered.length&&<p role="status" className="menuEmpty">Razdelka ni. Poskusi z drugo besedo ali <Link href="/iskanje" onClick={closeMenu}>išči po vsebinah portala</Link>.</p>}
 </dialog>
 <nav className="phoneBottom" aria-label="Mobilna navigacija">{shortcuts.map(([icon,label,href])=><Link key={href} href={href} aria-current={active(href)?"page":undefined}><Icon name={icon}/><span>{label}</span></Link>)}</nav></>
}

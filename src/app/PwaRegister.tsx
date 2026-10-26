"use client";
import {createContext,useContext,useEffect,useRef,useState,ReactNode} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
type PwaState={available:boolean;installed:boolean;installing:boolean;install:()=>Promise<void>;message:string};
const Context=createContext<PwaState>({available:false,installed:false,installing:false,install:async()=>{},message:""});
export const usePwa=()=>useContext(Context);
export default function PwaRegister({children}:{children:ReactNode}){
 const pathname=usePathname();

 const [prompt,setPrompt]=useState<InstallEvent|null>(null),[installed,setInstalled]=useState(false),[offline,setOffline]=useState(false),[waiting,setWaiting]=useState<ServiceWorker|null>(null),[message,setMessage]=useState(""),[updating,setUpdating]=useState(false);
 const requested=useRef(false),installBusy=useRef(false);const [installing,setInstalling]=useState(false);
 useEffect(()=>{if(installed&&pathname==="/namestitev")window.location.replace("/")},[installed,pathname]);
 useEffect(()=>{
  const display=window.matchMedia("(display-mode: standalone)");
  const standalone=()=>setInstalled(display.matches||(navigator as Navigator&{standalone?:boolean}).standalone===true);
  const connectivity=()=>setOffline(!navigator.onLine);
  const offer=(e:Event)=>{e.preventDefault();setPrompt(e as InstallEvent)};
  const installedEvent=()=>{setInstalled(true);setPrompt(null);setMessage("Veli Jože je nameščen.")};
  const t=setTimeout(()=>{standalone();connectivity()},0);
  window.addEventListener("beforeinstallprompt",offer);window.addEventListener("appinstalled",installedEvent);window.addEventListener("offline",connectivity);window.addEventListener("online",connectivity);if(typeof display.addEventListener==="function")display.addEventListener("change",standalone);else display.addListener(standalone);
  let stopped=false,registration:ServiceWorkerRegistration|undefined;const cleanups:(()=>void)[]=[];
  const check=()=>{if(registration&&!document.hidden&&navigator.onLine)void registration.update().catch(()=>{})};
  const controller=()=>{if(requested.current)window.location.reload()};
  if("serviceWorker" in navigator){
   navigator.serviceWorker.addEventListener("controllerchange",controller);
   void navigator.serviceWorker.register("/veli-sw-1.14.1.js",{scope:"/",updateViaCache:"none"}).then(r=>{
    if(stopped)return;registration=r;
    const watch=()=>{if(r.waiting&&navigator.serviceWorker.controller)setWaiting(r.waiting);const worker=r.installing;if(worker){const changed=()=>{if(worker.state==="installed"&&navigator.serviceWorker.controller&&r.waiting)setWaiting(r.waiting)};worker.addEventListener("statechange",changed);cleanups.push(()=>worker.removeEventListener("statechange",changed))}};
    r.addEventListener("updatefound",watch);cleanups.push(()=>r.removeEventListener("updatefound",watch));watch();check();
   }).catch(()=>{});
  }
  document.addEventListener("visibilitychange",check);const interval=setInterval(check,3600000);
  return()=>{stopped=true;clearTimeout(t);clearInterval(interval);cleanups.forEach(f=>f());window.removeEventListener("beforeinstallprompt",offer);window.removeEventListener("appinstalled",installedEvent);window.removeEventListener("offline",connectivity);window.removeEventListener("online",connectivity);if(typeof display.removeEventListener==="function")display.removeEventListener("change",standalone);else display.removeListener(standalone);document.removeEventListener("visibilitychange",check);if("serviceWorker" in navigator)navigator.serviceWorker.removeEventListener("controllerchange",controller)};
 },[]);
 async function install(){if(!prompt||installBusy.current)return;installBusy.current=true;setInstalling(true);try{await prompt.prompt();const choice=await prompt.userChoice;setPrompt(null);setMessage(choice.outcome==="accepted"?"Namestitev je potrjena.":"Namestitev lahko pozneje izbereš v meniju brskalnika.")}catch{setPrompt(null);setMessage("Namesti aplikacijo prek menija brskalnika.")}finally{installBusy.current=false;setInstalling(false)}}
 function update(){if(!waiting||!navigator.onLine)return;if(!window.confirm("Posodobim aplikacijo? Stran se bo ponovno odprla. Najprej shrani morebitno nedokončano objavo."))return;requested.current=true;setUpdating(true);waiting.postMessage({type:"ACTIVATE_UPDATE"});setTimeout(()=>{if(requested.current){requested.current=false;setUpdating(false);setMessage("Posodobitev še ni zaključena. Zapri in ponovno odpri aplikacijo.")}},15000)}
 return <Context.Provider value={{available:!!prompt,installed,installing,install,message}}><div className="pwaBar">{offline&&<p role="status">Brez internetne povezave. Objave, odgovori in prijave potrebujejo povezavo.</p>}{waiting&&<div className="pwaUpdate"><span>Na voljo je nova različica Veli Jože.</span><button disabled={offline||updating} onClick={update}>{updating?"Posodabljam …":"Posodobi"}</button></div>}{!installed&&<Link href="/namestitev">Navodila za namestitev na telefon</Link>}{message&&<p role="status">{message}</p>}</div>{children}</Context.Provider>
}

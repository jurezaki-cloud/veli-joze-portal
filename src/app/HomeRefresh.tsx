"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

/** Refresh server-rendered counts after the existing portal mutation events. */
export default function HomeRefresh(){
 const router=useRouter();
 useEffect(()=>{
  let dirty=false;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const refresh=()=>{
   dirty=true;
   if(document.visibilityState!=="visible"||timer!==undefined)return;
   timer=setTimeout(()=>{
    timer=undefined;
    if(document.visibilityState!=="visible")return;
    dirty=false;
    router.refresh();
   },100);
  };
  const visible=()=>{if(dirty)refresh();};
  window.addEventListener("portal-notifications-change",refresh);
  window.addEventListener("portal-visit-reviewed",refresh);
  document.addEventListener("visibilitychange",visible);
  return ()=>{
   if(timer!==undefined)clearTimeout(timer);
   window.removeEventListener("portal-notifications-change",refresh);
   window.removeEventListener("portal-visit-reviewed",refresh);
   document.removeEventListener("visibilitychange",visible);
  };
 },[router]);
 return null;
}

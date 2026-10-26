"use client";
import {useEffect} from "react";
import {clearLocalMessageData} from "@/lib/message-drafts";
export default function MessageStorageEvents(){
 useEffect(()=>{
  const receive=(event:StorageEvent)=>{if(event.key==="veli-joze-drafts-clear"&&event.newValue)clearLocalMessageData()};
  window.addEventListener("storage",receive);
  return()=>window.removeEventListener("storage",receive);
 },[]);
 return null;
}

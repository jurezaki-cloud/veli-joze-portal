"use client";
import {useState} from "react";
import {clearLocalMessageData} from "@/lib/message-drafts";
export default function ClearDraftsButton(){
 const [done,setDone]=useState(false);
 return <div><button type="button" onClick={()=>{clearLocalMessageData(true);setDone(true)}}>Počisti lokalne osnutke</button>{done&&<p role="status">Lokalni osnutki in ključi pošiljanja so počiščeni v tem zavihku. Odprti zavihki, ki prejmejo signal, jih prav tako počistijo.</p>}</div>;
}

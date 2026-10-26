"use client";
import {useState} from "react";

export default function MessagePhoto({src,alt}:{src:string;alt:string}){
 const [failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 const url=attempt?`${src}${src.includes("?")?"&":"?"}retry=${attempt}`:src;
 return <div className="messagePhotoPreview">{failed?<div role="status"><p>Fotografije ni mogoče naložiti.</p><button type="button" onClick={()=>{setAttempt(x=>x+1);setFailed(false);}}>Poskusi znova</button></div>:<a href={src} target="_blank" rel="noopener noreferrer" aria-label={`${alt} — odpri večjo fotografijo`}>
 {/* Protected images have unknown dimensions and are served directly by the authenticated API. */}
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img className="messagePhoto" src={url} alt={alt} loading="lazy" decoding="async" onError={()=>setFailed(true)}/>
 </a>}</div>;
}

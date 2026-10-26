"use client";
import Image from "next/image";
import {useState} from "react";
export default function ListingPhotos({id,title,hasPhoto,photos}:{id:string;title:string;hasPhoto:boolean;photos:string[]}){
 const [index,setIndex]=useState(0);
 const urls=[...(hasPhoto?[`/api/listings/photo?id=${id}`]:[]),...photos.map(photo=>`/api/listings/photo?id=${id}&photo=${photo}`)];
 if(!urls.length)return <div className="listingNoPhoto">Brez fotografije</div>;
 const selected=Math.min(index,urls.length-1);
 return <div className="listingPhotos"><a href={urls[selected]} target="_blank" rel="noopener noreferrer" aria-label={`Povečaj fotografijo: ${title}`}><Image src={urls[selected]} alt={`${title} · fotografija ${selected+1}`} width={640} height={420} unoptimized/></a>{urls.length>1&&<><div className="listingPhotoControls"><button type="button" aria-label="Prejšnja fotografija" onClick={()=>setIndex((selected-1+urls.length)%urls.length)}>‹</button><span aria-live="polite">{selected+1} / {urls.length}</span><button type="button" aria-label="Naslednja fotografija" onClick={()=>setIndex((selected+1)%urls.length)}>›</button></div><div className="listingThumbnails">{urls.map((url,i)=><button key={url} type="button" aria-label={`Fotografija ${i+1}`} aria-pressed={selected===i} onClick={()=>setIndex(i)}><Image src={url} alt="" width={80} height={60} unoptimized/></button>)}</div></>}</div>;
}

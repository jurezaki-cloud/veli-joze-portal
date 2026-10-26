"use client";
import Image from "next/image";
import {useState} from "react";
export default function MemberAvatar({id,name,updated,className="avatar"}:{id?:string;name:string;updated?:string|null;className?:string}){const src=id&&updated?`/api/members/${id}/avatar?v=${encodeURIComponent(updated)}`:"";const [failed,setFailed]=useState("");return <span className={`${className} profileAvatar`}>{src&&failed!==src?<Image src={src} alt={`Profilna fotografija: ${name}`} width={96} height={96} unoptimized onError={()=>setFailed(src)}/>:name.slice(0,2).toLocaleUpperCase("sl-SI")}</span>}

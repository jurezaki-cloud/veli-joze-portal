"use client";
import {clearLocalMessageData} from "@/lib/message-drafts";
export default function LogoutForm({className="accountLogout"}:{className?:string}){
 return <form action="/api/auth/logout" method="post" onSubmit={()=>clearLocalMessageData(true)}><button className={className} type="submit">Odjava</button></form>;
}

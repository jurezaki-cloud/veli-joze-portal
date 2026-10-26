"use client";
import {connectPortalUpdates} from "@/lib/portal-updates";
import {readApiResponse} from "@/lib/client-api";
import {useEffect,useState} from "react";
import Link from "next/link";
import {MessageAlertTracker,type MessageAlert,type MessageSummary} from "@/lib/message-alerts";

type Feed={ok:boolean;unread:number;data:{category:string;title:string;read:boolean}[]};

export default function NotificationIndicator() {
  const [feed,setFeed]=useState<Feed|null>(null);
  const [messages,setMessages]=useState<MessageSummary|null>(null);
  const [alert,setAlert]=useState<MessageAlert|null>(null);

  useEffect(()=>{
    let stopped=false,feedBusy=false,messageBusy=false,refreshPending=false,feedPending=false;
    const disconnect=connectPortalUpdates();
    const controller=new AbortController();
    const tracker=new MessageAlertTracker();
    const refreshFeed=async()=>{
      if(stopped||document.hidden)return;
      if(feedBusy){feedPending=true;return;}
      feedBusy=true;
      try {
        const response=await fetch("/api/notifications",{cache:"no-store",signal:controller.signal});
        if(stopped)return;
        if(response.ok)setFeed(await readApiResponse(response));
        else if([401,403].includes(response.status))setFeed(null);
      } catch {} finally {feedBusy=false;if(feedPending&&!stopped){feedPending=false;void refreshFeed();}}
    };
    const refreshMessages=async()=>{
      if(stopped||document.hidden)return;
      if(messageBusy){refreshPending=true;return;}
      messageBusy=true;
      try {
        const response=await fetch("/api/messages/summary",{cache:"no-store",signal:controller.signal});
        if(stopped)return;
        if(!response.ok){
          if([401,403].includes(response.status)){
            tracker.reset();setMessages(null);setAlert(null);
          }
          return;
        }
        const summary:MessageSummary=await readApiResponse(response);
        if(stopped)return;
        setMessages(summary);
        const activePeer=window.location.pathname==="/sporocila"
          ?new URLSearchParams(window.location.search).get("peer")||"":"";
        const nextAlert=tracker.consume(summary,activePeer);
        setAlert(previous=>nextAlert||(
          summary.latest.some(message=>previous?.messageIds.includes(message.id)&&message.sender_id!==activePeer)
            ?previous:null
        ));
      } catch {} finally {
        messageBusy=false;
        if(refreshPending&&!stopped){refreshPending=false;void refreshMessages();}
      }
    };
    const refresh=()=>{void refreshFeed();void refreshMessages();};
    const initial=setTimeout(refresh,0);
    const feedTimer=setInterval(()=>void refreshFeed(),60000);
    const messageTimer=setInterval(()=>void refreshMessages(),10000);
    window.addEventListener("portal-notifications-change",refresh);
    document.addEventListener("visibilitychange",refresh);
    window.addEventListener("online",refresh);
    return()=>{
      disconnect();stopped=true;controller.abort();clearTimeout(initial);
      clearInterval(feedTimer);clearInterval(messageTimer);
      window.removeEventListener("portal-notifications-change",refresh);
      document.removeEventListener("visibilitychange",refresh);
      window.removeEventListener("online",refresh);
    };
  },[]);

  if(!feed&&!messages)return null;
  const reminder=feed?.data.find(item=>item.category==="reminder"&&!item.read);
  return <>
    <div className="notificationIndicator">
      {feed&&<Link href="/moja-obvestila">Moja obvestila{feed.unread>0&&<strong aria-label={`${feed.unread} neprebranih obvestil`}>{feed.unread}</strong>}</Link>}
      {messages&&<Link className={messages.unread>0?"messageBadge hasUnread":"messageBadge"} href="/sporocila">
        <span aria-hidden="true">✉</span> Sporočila
        {messages.unread>0&&<strong aria-label={`${messages.unread} neprebranih zasebnih sporočil`}>{messages.unread}</strong>}
      </Link>}
      {reminder&&<p role="status">{reminder.title} <Link href="/dogodki">Poglej dogodek</Link></p>}
    </div>
    {alert&&<section className="messageToast" role="status" aria-live="polite" aria-atomic="true" aria-label="Novo zasebno sporočilo">
      <span className="messageToastIcon" aria-hidden="true">✉</span>
      <div><b>{alert.title}</b><p>Odpri pogovor in odgovori.</p><Link href={alert.href} onClick={()=>setAlert(null)}>Odpri sporočilo →</Link></div>
      <button type="button" aria-label="Zapri obvestilo o sporočilu" onClick={()=>setAlert(null)}>×</button>
    </section>}
  </>;
}

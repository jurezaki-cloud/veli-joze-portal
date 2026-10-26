"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {campDateKey,monthGrid} from "@/lib/camp-calendar";
type E={id:string;title:string;event_date:string};const weekdays=["Pon","Tor","Sre","Čet","Pet","Sob","Ned"];
export default function EventMonth({events}:{events:E[]}){
 const [today,setToday]=useState(""),[view,setView]=useState<{year:number;month:number}|null>(null);
 useEffect(()=>{const update=()=>{const key=campDateKey(new Date());setToday(key);setView(v=>v||{year:Number(key.slice(0,4)),month:Number(key.slice(5,7))-1})};const timer=setTimeout(update,0),interval=setInterval(update,60000);return()=>{clearTimeout(timer);clearInterval(interval)}},[]);
 if(!view)return <p role="status">Nalagam koledar …</p>;
 const grid=monthGrid(view.year,view.month),title=new Date(Date.UTC(grid.year,grid.month,15)).toLocaleDateString("sl-SI",{month:"long",year:"numeric",timeZone:"Europe/Zagreb"});
 const shift=(step:number)=>setView(v=>{if(!v)return v;const g=monthGrid(v.year,v.month+step);return {year:g.year,month:g.month}});
 return <section className="campCalendar" aria-label="Koledar dogodkov"><div className="calendarHeading"><h2 aria-live="polite">{title}</h2><div className="calendarControls"><button type="button" aria-label="Prejšnji mesec" onClick={()=>shift(-1)}>‹</button><button type="button" onClick={()=>setView({year:Number(today.slice(0,4)),month:Number(today.slice(5,7))-1})}>Danes</button><button type="button" aria-label="Naslednji mesec" onClick={()=>shift(1)}>›</button></div></div><div className="eventWeekdays" aria-hidden="true">{weekdays.map(day=><b key={day}>{day}</b>)}</div><div className="eventMonth">{Array.from({length:grid.lead},(_,i)=><span key={`empty-${i}`} aria-hidden="true"/>)}{Array.from({length:grid.days},(_,i)=>{const day=i+1,key=`${grid.year}-${String(grid.month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`,matches=events.filter(e=>campDateKey(e.event_date)===key);return <div className={`eventDay${key===today?" today":""}${matches.length?" hasEvents":""}`} key={key} aria-label={`${day}. ${title}${key===today?", danes":""}`} aria-current={key===today?"date":undefined}><b>{day}</b>{matches.map(e=><Link href={`#event-${e.id}`} className="eventDot" key={e.id} title={e.title}>{e.title}</Link>)}</div>})}</div><p className="calendarLegend"><span/>Danes · klikni dogodek za podrobnosti.</p></section>;
}

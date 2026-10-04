"use client";
import {FormEvent,useState} from "react";
import Link from "next/link";

export default function Page(){
 const [msg,setMsg]=useState(""); const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault(); setMsg(""); setBusy(true);
  const f=new FormData(e.currentTarget);
  const body={name:String(f.get("name")||""),nickname:String(f.get("nickname")||""),zone:String(f.get("zone")||""),parcel:String(f.get("parcel")||""),consent:f.get("consent")==="on"};
  const r=await fetch("/api/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  const data=await r.json(); setMsg(data.message||"Registracije trenutno ni mogoče zaključiti."); setBusy(false);
 }
 return <main className="module"><Link href="/" className="back">← Domov</Link><div className="authExperience">
 <section className="authWelcome"><span>POSTANI DEL SKUPNOSTI</span><h2>Naš kamp. Naši ljudje.</h2><p>Profil pavšalista ti odpre skupnostne funkcije portala, zasebni podatki pa ostanejo zaščiteni.</p><div className="authBenefits"><small>✓ Preverjen Google račun</small><small>✓ Klepet in pomoč</small><small>✓ Mali oglasi</small><small>✓ Dogodki in obvestila</small></div></section>
 <section className="authPane"><h3>Registracija pavšalista</h3><p>Registracijo začni z Google prijavo. E-pošto varno prevzamemo iz preverjenega Google računa.</p><a className="googleAuthButton" href="/api/auth/google">Nadaljuj z Google</a>
 <form className="functionalForm" method="post" action="/api/register" onSubmit={submit}><input name="name" required autoComplete="name" placeholder="Ime in priimek"/><input name="nickname" required placeholder="Vzdevek"/><select name="zone" required defaultValue=""><option value="" disabled>Izberi cono</option><option>A</option><option>B</option><option>C</option><option>D</option></select><input name="parcel" required placeholder="Številka parcele"/><div className="authPrivacy"><span>🔒</span><span>E-pošta in številka parcele nista javna podatka. Profil po registraciji čaka na potrditev moderatorja.</span></div><label className="consentRow"><input name="consent" type="checkbox" required/><span>Strinjam se s pravili skupnosti in obdelavo podatkov za namen delovanja profila pavšalista.</span></label><button disabled={busy}>{busy?"Pošiljam ...":"Pošlji registracijo"}</button>{msg&&<p className="formMessage">{msg}</p>}<p className="authSwitch">Že imaš profil? <Link href="/prijava">Prijava</Link></p></form></section>
 </div></main>;
}

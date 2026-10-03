"use client";
import {FormEvent,useState} from "react";
import Link from "next/link";
export default function Page(){
 const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMsg("");const f=new FormData(e.currentTarget);const r=await fetch("/api/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(f))});const d=await r.json();setMsg(d.message||"Prijava trenutno ni mogoča.");setBusy(false)}
 return <main className="module"><Link href="/" className="back">← Domov</Link><div className="authExperience">
 <section className="authWelcome"><span>VELI JOŽE · SKUPNOST</span><h2>Dobrodošel nazaj.</h2><p>Vse iz kampa na enem mestu — ljudje, dogodki, pomoč in poletni trenutki.</p><div className="authBenefits"><small>💬 Klepet s pavšalisti</small><small>📣 Obvestila skupnosti</small><small>📍 Kamp informacije</small><small>☀️ Vreme & morje</small></div></section>
 <section className="authPane"><h3>Prijava</h3><p>Vstopi v svoj profil Veli Jože.</p><form className="functionalForm" onSubmit={submit}><input name="email" required type="email" autoComplete="email" placeholder="E-pošta"/><input name="password" required type="password" autoComplete="current-password" placeholder="Geslo"/><button disabled={busy}>{busy?"Prijavljam ...":"Prijava v portal"}</button>{msg&&<p className="formMessage">{msg}</p>}<p className="authSwitch">Še nimaš profila? <Link href="/registracija">Ustvari račun</Link></p></form></section>
 </div></main>;
}

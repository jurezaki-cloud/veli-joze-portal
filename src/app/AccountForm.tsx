"use client";
import {readApiResponse} from "@/lib/client-api";
import {FormEvent,useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {zones} from "@/lib/zones";
type Action="register"|"login"|"forgot"|"resend"|"verify"|"reset";
export default function AccountForm({action}:{action:Action}){
 const router=useRouter(),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[success,setSuccess]=useState(false),[token,setToken]=useState(""),[google,setGoogle]=useState(false),[mail,setMail]=useState<boolean|null>(null);
 useEffect(()=>{let live=true;const t=setTimeout(()=>{if(!live)return;setSuccess(false);setMessage("");setGoogle(action==="register"&&new URLSearchParams(location.search).get("google")==="1");const raw=new URLSearchParams(location.hash.slice(1)).get("token")||"";setToken(raw);if(raw)history.replaceState(null,"",location.pathname)},0);void fetch("/api/auth/local",{cache:"no-store"}).then(r=>readApiResponse(r)).then(j=>{if(live)setMail(j.emailReady===true)}).catch(()=>{if(live)setMail(false)});return()=>{live=false;clearTimeout(t)}},[action]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(busy)return;const form=new FormData(e.currentTarget),b:Record<string,unknown>=Object.fromEntries(form.entries());if((action==="register"&&!google)||action==="reset"){if(b.password!==b.confirm){setMessage("Gesli se ne ujemata.");return}}
 setBusy(true);setMessage("");try{const body=google?{name:`${b.firstName||""} ${b.lastName||""}`.trim(),nickname:b.nickname,zone:b.zone,parcel:b.parcel,consent:b.consent==="on"}:{...b,action,token,consent:b.consent==="on"};const r=await fetch(google?"/api/register":"/api/auth/local",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}),j=await readApiResponse(r);setMessage(j.message||"Zahteve ni mogoče zaključiti.");if(r.ok){setSuccess(true);if(action==="login"||google){router.push(j.href||"/profil");router.refresh()}}}catch{setMessage("Povezava je prekinjena. Poskusi ponovno.")}finally{setBusy(false)}}
 const register=action==="register",password=action==="login"||(register&&!google)||action==="reset",requestMail=["register","forgot","resend"].includes(action)&&!google;
 return <><form className="functionalForm" onSubmit={submit}>{requestMail&&mail===false&&<p role="status">Pošiljanje e-pošte še ni nastavljeno. Za registracijo lahko uporabiš Google.</p>}
 {!success&&<>{["register","login","forgot","resend"].includes(action)&&!google&&<label>E-pošta<input name="email" type="email" autoComplete="email" maxLength={254} required/></label>}
 {register&&<><div className="profileNameGrid"><label>Ime<input name="firstName" autoComplete="given-name" maxLength={60} required/></label><label>Priimek<input name="lastName" autoComplete="family-name" maxLength={60}/></label></div><label>Vzdevek<input name="nickname" maxLength={60} required/></label><label>Cona<select name="zone" defaultValue="" required><option value="" disabled>Izberi cono</option>{zones.map(z=><option key={z.value} value={z.value}>{z.label}</option>)}</select></label><label>Parcela<input name="parcel" maxLength={80} required/></label></>}
 {password&&<label>Geslo<input type="password" name="password" minLength={action==="login"?undefined:12} maxLength={128} autoComplete={action==="login"?"current-password":"new-password"} required/>{action!=="login"&&<small>Od 12 do 128 znakov. Lahko uporabiš daljšo frazo.</small>}</label>}
 {((register&&!google)||action==="reset")&&<label>Ponovi geslo<input type="password" name="confirm" minLength={12} maxLength={128} autoComplete="new-password" required/></label>}
 {register&&<><p>E-pošta in parcela sta zasebni. Drugim bo prikazan vzdevek. Članstvo odobri moderator.</p><label className="consentRow"><input type="checkbox" name="consent" required/><span>Sprejemam <Link href="/pogoji-uporabe" target="_blank">pogoje uporabe</Link> in <Link href="/pravila-skupnosti" target="_blank">pravila skupnosti</Link>. Seznanjen sem s <Link href="/politika-zasebnosti" target="_blank">politiko zasebnosti</Link>. Potrjujem, da sem polnoleten.</span></label></>}
 {(action==="verify"||action==="reset")&&!token&&<p>Povezava manjka. Zahtevaj novo spodaj.</p>}
 <button disabled={busy||((action==="verify"||action==="reset")&&!token)||(requestMail&&mail!==true)}>{busy?"Pošiljam …":action==="login"?"Prijava":register?"Ustvari profil":action==="verify"?"Potrdi e-pošto":action==="reset"?"Shrani novo geslo":"Pošlji povezavo"}</button></>}
 {message&&<p role="status" className="formMessage">{message}</p>}</form>
 {action==="login"&&<p><Link href="/pozabljeno-geslo">Pozabljeno geslo?</Link></p>}
 {action!=="login"&&<p><Link href="/prijava">Nazaj na prijavo</Link></p>}
 {["register","login","verify"].includes(action)&&<p><Link href="/ponovna-potrditev">Ponovno pošlji potrditev e-pošte</Link></p>}
 {action==="reset"&&<p><Link href="/pozabljeno-geslo">Zahtevaj novo povezavo</Link></p>}</>;
}

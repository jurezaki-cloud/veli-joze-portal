"use client";
import Image from "next/image";
import Link from "next/link";
import {usePwa} from "./PwaRegister";
export default function HomeInstall(){
 const {available,installed,installing,install}=usePwa();
 if(installed)return null;
 return <section className="homeInstall" aria-labelledby="home-install-title">
  <Image src="/icons/veli-joze-v108-192.png" width={64} height={64} alt="Logotip Veli Jože"/>
  <div><h2 id="home-install-title">Veli Jože vedno pri roki.</h2><p>Dodaj portal na telefon in odpri skupnost z enim dotikom.</p></div>
  {available?<button disabled={installing} onClick={()=>void install()}>{installing?"Odpiram namestitev …":"Namesti aplikacijo ↗"}</button>:<Link href="/namestitev">Navodila za namestitev ↗</Link>}
 </section>;
}

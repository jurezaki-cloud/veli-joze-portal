"use client";
import Link from "next/link";
export default function PrivacyFooter(){return <footer className="privacyFooter" aria-label="Zasebnost in pravna obvestila"><span>Upravljavec: JU-TAN studio, Tanja Hrup s.p.</span><div><Link href="/politika-zasebnosti">Zasebnost</Link><Link href="/piskotki">Piškotki</Link><button type="button" onClick={()=>window.dispatchEvent(new Event("vj-cookie-settings"))}>Nastavitve piškotkov</button><Link href="/pogoji-uporabe">Pogoji uporabe</Link><Link href="/moja-zasebnost">Moja zasebnost</Link></div></footer>}

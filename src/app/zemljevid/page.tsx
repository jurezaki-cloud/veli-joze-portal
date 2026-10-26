"use client";
import Image from "next/image";
import { useState } from "react";
import Section from "../Section";
export default function Page() {
 const [zoom, setZoom] = useState(1);
 return <Section title="Načrt kampa Veli Jože iz leta 2021"><div className="mapStatus"><span>NAČRT · 2021</span><p>Načrt kampa Veli Jože, ki ga je posredovala skupnost. Razporeditev in storitve so se od leta 2021 lahko spremenile.</p></div>
 <div className="planToolbar" aria-label="Povečava načrta"><button onClick={() => setZoom(z => Math.max(1, z - .5))} disabled={zoom === 1} aria-label="Pomanjšaj načrt">−</button><output aria-live="polite">{Math.round(zoom * 100)} %</output><button onClick={() => setZoom(z => Math.min(4, z + .5))} disabled={zoom === 4} aria-label="Povečaj načrt">+</button><button onClick={() => setZoom(1)}>Celoten načrt</button><a href="/plan-kampa-2021.png" target="_blank" rel="noopener noreferrer">Odpri izvirnik ↗</a><a href="/plan-kampa-2021.png" download="Veli-Joze-plan-kampa-2021.png">Prenesi načrt</a></div>
 <div className="campPlanViewport" tabIndex={0} role="region" aria-label="Načrt kampa; povečano sliko premikaj z drsniki ali puščicami"><div className="campPlanCanvas" style={{width:`${zoom * 100}%`}}><Image src="/plan-kampa-2021.png" alt="Načrt kampa Veli Jože iz leta 2021: oštevilčene parcele, plaža, recepcija, sanitarije, parkirišča in športne površine. Legenda je na desni strani in spodaj." width={1220} height={917} unoptimized priority/></div></div>
 <p className="planHelp">Za številke parcel povečaj načrt. Povečano sliko premikaj z drsniki; na telefonu jo povleci s prstom.</p>
 <div className="planSummary"><article><h3>Prihod v kamp</h3><p>Vhod in recepcija sta na desni strani načrta, ob parkiriščih.</p></article><article><h3>Obala in plaže</h3><p>Morje je ob zgornjem in levem robu načrta. Plaža za pse je označena ob zgornjem delu obale.</p></article><article><h3>Legenda na načrtu</h3><p>Načrt vsebuje oznake sanitarij, parkirišč, prve pomoči, gostinskih objektov in športnih površin.</p></article></div>
 <p><a className="mapExternal" href="https://www.google.com/maps/search/?api=1&query=Kamp+Veli+Joze+Savudrija" target="_blank" rel="noopener noreferrer">Odpri lokacijo kampa in navodila za prihod</a></p>
 <div className="sourceNotice">Vir: posredovana datoteka »Plan kampa2021.png«, z oznakami Zagrebškega holdinga / Nazor. Gre za starejši načrt, ne za potrditev današnjega stanja. Na načrtu označen Wi-Fi hotspot ne potrjuje trenutne razpoložljivosti interneta; po informacijah portala kamp lastnega interneta ne ponuja.</div>
 </Section>;
}

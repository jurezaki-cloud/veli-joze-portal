import Section from "../Section";
const metrics=[
 ["🌡️","Temperatura zraka","—","Aktualni vir še ni priklopljen"],
 ["🌊","Temperatura morja","—","Aktualni vir še ni priklopljen"],
 ["💨","Veter","—","Smer in hitrost po priklopu"],
 ["☔","Padavine","—","Napoved po priklopu"]
];
export default function Page(){return <Section title="Vreme & morje">
 <div className="weatherHero weatherHeroPro"><div><small>SAVUDRIJA · VREMENSKI CENTER</small><h2>Vreme in razmere na morju</h2><p>Na enem mestu: temperatura, morje, veter, padavine in pomembna opozorila.</p></div><div className="weatherSourceState"><i/>ČAKA NA PREVERJEN VIR</div></div>
 <div className="weatherGrid weatherGridPro">{metrics.map(x=><article key={x[1]}><span>{x[0]}</span><div><b>{x[1]}</b><strong>{x[2]}</strong><small>{x[3]}</small></div></article>)}</div>
 <div className="weatherForecast"><div><small>NAPOVED</small><h3>Naslednji dnevi</h3><p>Večdnevna napoved bo prikazana takoj po priklopu preverjenega vremenskega ponudnika.</p></div><span className="pendingAction">Vir v pripravi</span></div>
 <div className="sourceNotice">Portal namenoma ne prikazuje demo temperatur kot dejanskih podatkov. Aktualne vrednosti bodo imele jasno naveden vir in čas zadnje osvežitve.</div>
 </Section>}
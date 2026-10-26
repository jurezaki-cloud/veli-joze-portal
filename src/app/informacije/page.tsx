import {campInformation,campSchedule} from "@/lib/camp-information";
import Link from "next/link";
import Section from "../Section";

export default function Page(){return <Section title="Kamp Veli Jože v Savudriji – informacije">
 <div className="infoHero"><small>VSE NA ENEM MESTU</small><h2>Kamp in bivanje</h2><p>Urniki, koristne informacije in priporočila za urejeno življenje v kampu.</p></div>
 <div className="infoGrid infoDetails">{campInformation.map(x=><article key={x.title}><span aria-hidden="true">{x.icon}</span><div><h3>{x.title}</h3><p className="infoIntro">{x.intro}</p>{x.schedule&&<dl className="campSchedule">{campSchedule.flatMap(row=>[<dt key={`${row.label}-label`}>{row.label}</dt>,<dd key={`${row.label}-hours`}>{row.hours}</dd>])}</dl>}{x.paragraphs.map(p=><p key={p}>{p}</p>)}{x.note&&<small className="infoNote">{x.note}</small>}</div></article>)}</div>
 <div className="infoActions"><Link href="/sos">SOS / pomembni kontakti</Link><Link href="/vreme">Vreme & morje</Link><Link href="/tezave">Prijavi težavo</Link></div>
 <section className="legalContent"><h2>Pogosta vprašanja o portalu in kampu</h2><h3>Je to uradna spletna stran kampa?</h3><p>Ne. Veli Jože je neuradni portal skupnosti pavšalistov. Za rezervacije, cene in veljavna pravila se obrni na upravo oziroma recepcijo kampa.</p><h3>Kaj lahko preberem brez prijave?</h3><p>Informacije o kampu, javna obvestila, dogodke, galerijo, vreme in predloge za izlete. Prijava je namenjena članskim funkcijam skupnosti.</p><h3>Kje najdem ideje za izlete iz Savudrije?</h3><p>Na strani <Link href="/kam-danes">Plaže, izleti in kulinarika v okolici Savudrije</Link>. Pred odhodom preveri aktualne urnike pri ponudniku.</p><h3>Kje preverim razmere pred odhodom na morje?</h3><p>Odpri <Link href="/vreme">vreme in morje za Savudrijo</Link> ter preveri čas podatkov. Modelni podatki portala so informativni.</p></section>
 <div className="sourceNotice">Portal je neuradni portal skupnosti. Priporočila na tej strani ne nadomeščajo uradnega hišnega reda ali navodil uprave kampa.</div>
</Section>}

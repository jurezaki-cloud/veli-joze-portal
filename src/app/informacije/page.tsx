import Link from "next/link";
import Section from "../Section";
const info=[
 ["🏕️","Kamp & bivanje","Praktične informacije za vsakdan v kampu."],
 ["🕒","Urniki","Recepcija, trgovina in druge storitve."],
 ["♻️","Odpadki & čistoča","Lokacije in navodila za urejeno skupnost."],
 ["🐾","Hišni ljubljenčki","Koristne informacije za lastnike živali."],
 ["📶","Internet & povezljivost","Informacije o povezavi in uporabnih storitvah."],
 ["❓","Pogosta vprašanja","Hitri odgovori na vprašanja pavšalistov."]
];
export default function Page(){return <Section title="Vse informacije">
 <div className="infoHero"><small>VSE NA ENEM MESTU</small><h2>Manj iskanja. Več poletja.</h2><p>Uradne informacije bodo jasno označene in ločene od nasvetov skupnosti.</p></div>
 <div className="infoGrid">{info.map(x=><article key={x[1]}><span>{x[0]}</span><div><b>{x[1]}</b><p>{x[2]}</p><small>Vsebina v pripravi · vir bo označen</small></div></article>)}</div>
 <div className="infoActions"><Link href="/sos">SOS / pomembni kontakti</Link><Link href="/vreme">Vreme & morje</Link><Link href="/tezave">Prijavi težavo</Link></div>
 <div className="sourceNotice">Portal ne bo predstavljal informacij skupnosti kot uradne podatke kampa. Pri vsaki pomembni informaciji bo prikazan njen vir oziroma status.</div>
</Section>}
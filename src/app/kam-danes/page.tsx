import Section from "../Section";
const cards=[
 ["🍽️","Konobe & restavracije","Ideje skupnosti za dobro večerjo.","GASTRONOMIJA"],
 ["🏖️","Plaže & kopanje","Predlogi za mirne zalive in kopanje.","MORJE"],
 ["🚲","Izleti","Kolesarjenje, sprehodi in družinski izleti.","DOŽIVETJA"],
 ["🎵","Dogajanje","Večerni dogodki in lokalno dogajanje.","DOGODKI"]
];
export default function Page(){return <Section title="Kam danes?">
 <div className="todayHero"><small>IDEJE ZA DANES</small><h2>Poletje je lepše, ko veš kam.</h2><p>Priporočila bodo združila predloge skupnosti in preverjene informacije.</p></div>
 <div className="todayGrid">{cards.map(x=><article key={x[1]}><small>{x[3]}</small><strong>{x[0]}</strong><h3>{x[1]}</h3><p>{x[2]}</p><span className="pendingAction">Predlogi v pripravi</span></article>)}</div>
 <div className="sourceNotice">Priporočila še niso aktivna. Pri produkcijski verziji bo jasno označeno, kaj je predlog skupnosti in kaj preverjena informacija iz zunanjega vira.</div>
 </Section>}
import Section from "../Section";
const groups=[
 ["🚨","Nujna pomoč","112","Enotna evropska številka za vse nujne službe na Hrvaškem."],
 ["👮","Policija","192","Policija Republike Hrvaške."],
 ["🚒","Gasilci","193","Gasilska služba Republike Hrvaške."],
 ["🚑","Nujna medicinska pomoč","194","Nujna medicinska pomoč na Hrvaškem."],
 ["⚓","Reševanje na morju","195","Služba iskanja in reševanja na morju."]
];
export default function Page(){return <Section title="SOS / Kontakti">
 <div className="sosIntro"><h2>Ko potrebuješ pomoč</h2><p>Preverjene hrvaške številke za nujne primere. Če nisi prepričan, katero službo potrebuješ, pokliči 112.</p></div>
 <div className="sosGrid">{groups.map(x=><article key={x[1]}><span>{x[0]}</span><div><b>{x[1]}</b><a className="sosNumber" href={"tel:"+x[2]}>{x[2]}</a><small>{x[3]}</small></div></article>)}</div>
 <div className="communityContact"><b>Kontakti skupnosti</b><p>Moderatorji in skrbniki portala bodo prikazani tukaj po vzpostavitvi uporabniških računov.</p></div>
 <small className="demoNote">Nujne številke so preverjene pri uradnih virih Republike Hrvaške. Kontakti skupnosti še niso produkcijsko priklopljeni.</small>
 </Section>}
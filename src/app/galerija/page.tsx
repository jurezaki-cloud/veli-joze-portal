import Section from "../Section";
const items=[["Sončni zahod","ZAHOD"],["Morje","MORJE"],["Večer v kampu","VEČER"],["Poletno druženje","SKUPNOST"],["Plaža","PLAŽA"],["Savudrija","SAVUDRIJA"]];
export default function Page(){return <Section title="Galerija Veli Jože">
 <div className="galleryHead"><div><small>SPOMINI SKUPNOSTI</small><h2>Naši poletni spomini</h2><p>Galerija bo namenjena fotografijam, za katere uporabniki dovolijo objavo.</p></div><span className="pendingAction">Nalaganje · po produkcijskem priklopu</span></div>
 <div className="galleryGrid">{items.map((x,i)=><article className={"photo p"+(i+1)} key={x[0]}><em>{x[1]}</em><span>{x[0]}</span></article>)}</div>
 <div className="galleryPolicy"><b>Fotografije z dovoljenjem</b><span>Pred objavo uporabniških fotografij bodo vključeni prijava uporabnika, soglasje za objavo in moderatorski pregled.</span></div>
 <small className="demoNote">Trenutne kartice so vizualni demo in niso fotografije uporabnikov.</small>
 </Section>}
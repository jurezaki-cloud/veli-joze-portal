import Section from "../Section";
const legend=["🏖️ Plaža","🚿 Sanitarije","🛒 Trgovina","ⓘ Recepcija"];
export default function Page(){return <Section title="Zemljevid kampa">
 <div className="mapStatus"><span>DEMO SHEMA</span><p>Prikaz je orientacijski in ni uradni načrt Kampa Veli Jože ali parcel.</p></div>
 <div className="campMap"><div className="sea">JADRANSKO MORJE</div><div className="beach">PLAŽA</div><div className="zones"><span>A</span><span>B</span><span>C</span><span>D</span></div><i className="pin reception">●<small>Recepcija</small></i><i className="pin shop">●<small>Trgovina</small></i><i className="pin wc">●<small>Sanitarije</small></i></div>
 <div className="mapLegend"><b>Legenda</b>{legend.map(x=><span className="mapLegendChip" key={x}>{x}</span>)}</div>
 <div className="sourceNotice">Pred javno objavo bo zemljevid zamenjan s preverjenim načrtom oziroma podatkovnim virom z dovoljenjem za uporabo. Lokacij parcel portal ne bo ugibal.</div>
 </Section>}
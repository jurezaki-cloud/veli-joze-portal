import Section from "../Section";
import AccountForm from "../AccountForm";
export default function Page(){return <Section title="Potrditev e-pošte"><div className="authPane"><p>Potrdi svoj e-poštni naslov. Nato se lahko prijaviš in urediš profil; članstvo odobri moderator.</p><AccountForm action="verify"/></div></Section>}

import Section from "../Section";
import AccountForm from "../AccountForm";
export default function Page(){return <Section title="Pozabljeno geslo"><div className="authPane"><p>Vnesi e-pošto svojega profila. Prejel boš povezavo za novo geslo, veljavno 30 minut. Tudi obstoječemu Google profilu lahko tako dodaš geslo.</p><AccountForm action="forgot"/></div></Section>}

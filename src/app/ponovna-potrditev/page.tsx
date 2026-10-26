import Section from "../Section";
import AccountForm from "../AccountForm";
export default function Page(){return <Section title="Ponovna potrditev e-pošte"><div className="authPane"><p>Vnesi naslov, uporabljen pri registraciji. Nova povezava za potrditev velja 24 ur.</p><AccountForm action="resend"/></div></Section>}

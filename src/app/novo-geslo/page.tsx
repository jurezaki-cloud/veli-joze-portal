import Section from "../Section";
import AccountForm from "../AccountForm";
export default function Page(){return <Section title="Novo geslo"><div className="authPane"><p>Izberi novo geslo. Po spremembi se vse prejšnje prijave zaključijo.</p><AccountForm action="reset"/></div></Section>}

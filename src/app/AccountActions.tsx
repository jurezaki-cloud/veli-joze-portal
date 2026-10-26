import Link from "next/link";
import LogoutForm from "./LogoutForm";
import MemberAvatar from "./MemberAvatar";
import type { Member } from "@/lib/domain";
type Account = Pick<Member, "nickname" | "displayName" | "role" | "approved"> & Partial<Pick<Member,"id"|"avatarUpdatedAt">>;
export default function AccountActions({ member }: { member: Account | null }) {
 if (!member) return <div className="accountActions" aria-label="Uporabniški račun"><Link className="accountLogin" href="/prijava">Prijava</Link><Link className="accountRegister" href="/registracija">Registracija</Link></div>;
 const name = member.nickname || member.displayName;
 const canReview = member.approved && ["admin", "moderator"].includes(member.role);
 const label = !member.approved ? "Čaka na odobritev" : member.role === "admin" ? "Administrator" : member.role === "moderator" ? "Moderator" : "Pavšalist";
 return <div className="accountActions accountSignedIn" aria-label="Uporabniški račun"><Link className="topProfile" href="/profil" aria-label={`Moj profil: ${name}`}><MemberAvatar id={member.id} name={name} updated={member.avatarUpdatedAt} className="topAvatar"/><span className="accountIdentity"><b>{name}</b><small>{label}</small></span></Link>{member.approved&&<Link className="accountLogin" href="/moj-portal">Moj portal</Link>}{canReview && <Link className="accountLogin" href="/admin">Administracija</Link>}<LogoutForm/></div>;
}

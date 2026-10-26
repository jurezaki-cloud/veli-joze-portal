import {RULES_VERSION} from "@/lib/rules";
import {NextResponse} from "next/server";
import {randomBytes,randomUUID} from "node:crypto";
import {getDatabase} from "@/lib/database";
import {rateLimit} from "@/lib/rate-limit";
import {readJson,requireSameOrigin} from "@/lib/api-security";
import {hashPassword,verifyPassword,validPassword,validEmail,tokenHash} from "@/lib/password";
import {emailReady,sendAccountEmail} from "@/lib/account-email";
import {validZone} from "@/lib/zones";
import {createSessionToken,sessionCookie} from "@/lib/auth-adapter";
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"cache-control":"private, no-store"}});
const accepted="Zahteva je sprejeta. Preveri e-pošto in neželeno pošto. Če sporočila ne prejmeš, poskusi ponovno ali se obrni na administratorja.";
type Account={id:string;email:string;role:"member"|"moderator"|"admin";approved:boolean;password_hash:string|null;email_verified_at:string|null;blocked_permanent:boolean;blocked_until:string|null;session_version:number};
let dummy:Promise<string>|undefined;
export async function GET(){return json({ok:true,emailReady:emailReady()})}
export async function POST(req:Request){
 const origin=requireSameOrigin(req);if(origin)return origin;
 const parsed=await readJson(req,8192);if(!parsed.ok)return parsed.response;
 const b=parsed.body,action=String(b.action||"");
 if(!["register","login","forgot","resend","verify","reset"].includes(action))return json({ok:false,message:"Neveljavna zahteva."},400);
 try{
 const limited=await rateLimit(req,`account-${action}`,action==="login"?10:5,300000);if(limited)return limited;
 const db=getDatabase();
 if(action==="verify"||action==="reset"){
  if(typeof b.token!=="string"||!/^[a-f0-9]{64}$/.test(b.token))return json({ok:false,message:"Povezava ni veljavna."},400);
  if(action==="reset"&&!validPassword(b.password))return json({ok:false,message:"Geslo mora imeti od 12 do 128 znakov."},400);
  const hash=action==="reset"?await hashPassword(b.password):null;
  const result=action==="verify"?await db.query<{member_id:string}>(`with consumed as (delete from account_tokens where token_hash=$1 and purpose='verify' and expires_at>now() returning member_id) update member_credentials c set email_verified_at=now() from consumed t where c.member_id=t.member_id returning c.member_id`,[tokenHash(b.token)]):await db.query<{member_id:string}>(`with consumed as (delete from account_tokens where token_hash=$1 and purpose='reset' and expires_at>now() returning member_id), credentials as (insert into member_credentials(member_id,password_hash,email_verified_at) select member_id,$2,now() from consumed on conflict(member_id) do update set password_hash=excluded.password_hash,email_verified_at=coalesce(member_credentials.email_verified_at,now()),updated_at=now() returning member_id), invalidate as (update members set session_version=session_version+1 where id in(select member_id from credentials) returning id), cleanup as (delete from account_tokens where member_id in(select member_id from credentials) and token_hash<>$1) select member_id from credentials`,[tokenHash(b.token),hash]);
  if(!result.rows.length)return json({ok:false,message:"Povezava je potekla ali je že uporabljena. Zahtevaj novo."},400);
  return json({ok:true,message:action==="verify"?"E-pošta je potrjena. Zdaj se prijavi; članstvo nato odobri moderator.":"Geslo je spremenjeno. Zdaj se prijavi z novim geslom."});
 }
 const email=typeof b.email==="string"?b.email.trim().toLowerCase():"";
 if(!validEmail(email))return json({ok:false,message:"Vnesi veljaven e-poštni naslov."},400);
 const emailLimited=await rateLimit(req,`account-email-${action}-${tokenHash(email)}`,action==="login"?10:3,900000);if(emailLimited)return emailLimited;
 if(action==="login"){
  if(typeof b.password!=="string"||b.password.length>128)return json({ok:false,message:"Preveri e-pošto in geslo."},401);
  const result=await db.query<Account>(`select m.id,m.email,m.role,m.approved,m.blocked_permanent,m.blocked_until,m.session_version,c.password_hash,c.email_verified_at from members m left join member_credentials c on c.member_id=m.id where lower(m.email)=$1`,[email]);
  const row=result.rows[0];dummy??=hashPassword(randomBytes(24).toString("hex"));
  const good=await verifyPassword(b.password,row?.password_hash||await dummy);
  if(!row||!row.password_hash||!good)return json({ok:false,message:"Preveri e-pošto in geslo."},401);
  if(!row.email_verified_at)return json({ok:false,message:"Najprej potrdi e-pošto. Spodaj lahko zahtevaš novo potrditveno sporočilo."},403);
  if(row.blocked_permanent||(row.blocked_until&&new Date(row.blocked_until).getTime()>Date.now()))return json({ok:false,message:"Dostop je blokiran. Obrni se na administratorja."},403);
  const token=await createSessionToken({id:row.id,email:row.email,role:row.role,approved:row.approved,sessionVersion:row.session_version});
  const response=json({ok:true,message:"Prijava je uspela.",href:row.approved?"/":"/profil?pending=1"});response.cookies.set(sessionCookie,token,{httpOnly:true,secure:true,sameSite:"lax",maxAge:604800,path:"/"});return response;
 }
 if(!emailReady())return json({ok:false,message:"Pošiljanje e-pošte še ni nastavljeno. Administrator mora nastaviti pošto; uporabiš lahko Google prijavo."},503);
 let id:string|undefined;
 if(action==="register"){
  const field=(key:string,max:number)=>typeof b[key]==="string"&&b[key].trim().length<=max?b[key].trim():"";
  const first=field("firstName",60),last=field("lastName",60),nick=field("nickname",60),parcel=field("parcel",80);
  if(!first||!nick||!parcel||!validZone(b.zone)||b.consent!==true||!validPassword(b.password))return json({ok:false,message:"Izpolni ime, vzdevek, cono, parcelo in pogoje. Geslo naj ima vsaj 12 znakov."},400);
  const password=await hashPassword(b.password);
  const r=await db.query<{id:string}>(`with added as (insert into members(id,email,display_name,nickname,first_name,last_name,profile_nickname,zone,parcel_private,show_zone,approved,rules_accepted_at,rules_version) values($1,$2,$3,$3,$4,$5,$3,$6,$7,false,false,now(),$9) on conflict(email) do nothing returning id), credentials as (insert into member_credentials(member_id,password_hash) select id,$8 from added) select id from added`,[randomUUID(),email,nick,first,last,b.zone,parcel,password,RULES_VERSION]);id=r.rows[0]?.id;
 }else{
  const r=await db.query<{id:string}>(`select m.id from members m left join member_credentials c on c.member_id=m.id where lower(m.email)=$1 and (not m.blocked_permanent and (m.blocked_until is null or m.blocked_until<=now())) ${action==="resend"?"and c.email_verified_at is null and c.member_id is not null":""}`,[email]);id=r.rows[0]?.id;
 }
 if(id){
  const purpose=action==="forgot"?"reset":"verify",raw=randomBytes(32).toString("hex");
  await db.query(`insert into account_tokens(token_hash,member_id,purpose,expires_at) values($3,$1,$2,now()+case when $2='verify' then interval '24 hours' else interval '30 minutes' end) on conflict(member_id,purpose) do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at,created_at=now()`,[id,purpose,tokenHash(raw)]);
  try{await sendAccountEmail(email,purpose,raw)}catch{await db.query("delete from account_tokens where token_hash=$1",[tokenHash(raw)]);console.error("Account email delivery failed; check mail configuration.");return json({ok:true,message:accepted},202)}
 }
 return json({ok:true,message:accepted},202);
 }catch{return json({ok:false,message:"Zahteve trenutno ni mogoče zaključiti. Poskusi ponovno."},503)}
}

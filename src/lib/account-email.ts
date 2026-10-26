import {spawn} from "node:child_process";
import {existsSync} from "node:fs";
import {validEmail} from "./password";
export function emailReady(){return !!process.env.AUTH_SECRET&&validEmail(process.env.MAIL_FROM)&&((process.env.MAIL_PROVIDER==="resend"&&!!process.env.RESEND_API_KEY)||(process.env.MAIL_PROVIDER==="sendmail"&&existsSync("/usr/sbin/sendmail")))}
export async function sendAccountEmail(to:string,purpose:"verify"|"reset",token:string){
 if(!emailReady()||!validEmail(to))throw new Error("mail unavailable");
 const path=purpose==="verify"?"potrditev-emaila":"novo-geslo";
 const link=`https://www.veli-joze.eu/${path}#token=${encodeURIComponent(token)}`;
 const subject=purpose==="verify"?"Veli Jože: potrditev e-pošte":"Veli Jože: ponastavitev gesla";
 const text=`${subject}\n\nOdpri povezavo in potrdi dejanje:\n${link}\n\nPovezava velja ${purpose==="verify"?"24 ur":"30 minut"} in jo lahko uporabiš enkrat. Če zahteve nisi poslal, sporočilo prezri.\n\nSkupnost Veli Jože`;
 await sendPortalEmail(to,subject,text);
}
export async function sendPortalEmail(to:string,subject:string,text:string,idempotencyKey?:string){
 if(!emailReady()||!validEmail(to)||/[\r\n]/.test(subject))throw new Error("mail unavailable");
 if(process.env.MAIL_PROVIDER==="resend"){
  const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:`Bearer ${process.env.RESEND_API_KEY}`,"content-type":"application/json",...(idempotencyKey?{"Idempotency-Key":idempotencyKey}:{})},body:JSON.stringify({from:process.env.MAIL_FROM,to:[to],subject,text}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error("mail unavailable");return;
 }
 await new Promise<void>((resolve,reject)=>{const child=spawn("/usr/sbin/sendmail",["-t","-i"],{stdio:["pipe","ignore","ignore"]});const timer=setTimeout(()=>{child.kill();reject(new Error("mail timeout"))},15000);child.on("error",()=>{clearTimeout(timer);reject(new Error("mail unavailable"))});child.on("close",code=>{clearTimeout(timer);if(code===0)resolve();else reject(new Error("mail unavailable"))});child.stdin.on("error",()=>reject(new Error("mail unavailable")));child.stdin.end(`From: ${process.env.MAIL_FROM}\r\nTo: ${to}\r\nSubject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(text).toString("base64").match(/.{1,76}/g)?.join("\r\n")}\r\n`)});
}

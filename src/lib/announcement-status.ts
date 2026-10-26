/** Dated, single-day service interruptions stop appearing as current after that day. */
export function isPastAnnouncement(item:{title:string;type?:string},now=new Date()):boolean{
 if(!/prekinitev|prekinjena oskrba/i.test(item.title))return false;
 const match=item.title.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
 if(!match)return false;
 const [,day,month,year]=match;
 const date=new Date(Date.UTC(Number(year),Number(month)-1,Number(day)));
 if(date.getUTCDate()!==Number(day)||date.getUTCMonth()+1!==Number(month))return false;
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Zagreb',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`<today;
}

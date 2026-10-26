export function campDateKey(value:string|Date):string{
 if(typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
 const date=new Date(value);if(Number.isNaN(date.getTime()))return "";
 const parts=new Intl.DateTimeFormat("en",{timeZone:"Europe/Zagreb",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
 const part=(type:string)=>parts.find(p=>p.type===type)?.value||"";
 return `${part("year")}-${part("month")}-${part("day")}`;
}
export function monthGrid(year:number,month:number){const first=new Date(Date.UTC(year,month,1));return {year:first.getUTCFullYear(),month:first.getUTCMonth(),lead:(first.getUTCDay()+6)%7,days:new Date(Date.UTC(year,month+1,0)).getUTCDate()};}

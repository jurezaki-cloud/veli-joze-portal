type DatedMessage={id:string;createdAt?:string;created_at?:string};
const date=(item:DatedMessage)=>(item.createdAt||item.created_at||"").replace(/\.(\d+)Z$/,(_match,digits:string)=>"."+digits.padEnd(6,"0")+"Z");
/** Latest page is authoritative; loaded history before its boundary is retained. */
export function mergeMessageHistory<T extends DatedMessage>(existing:T[],incoming:T[],latest=false):T[]{
 const first=incoming[0];
 const older=latest?existing.filter(item=>first&&(date(item)<date(first)||date(item)===date(first)&&item.id<first.id)):existing;
 const byId=new Map(older.map(item=>[item.id,item]));
 for(const item of incoming)byId.set(item.id,item);
 return [...byId.values()].sort((a,b)=>date(a).localeCompare(date(b))||a.id.localeCompare(b.id));
}

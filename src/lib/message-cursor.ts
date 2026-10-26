const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function readMessageCursor(value:string|null):{time:string;id:string}|null|false{
 if(value===null)return null;
 if(value.length>180||!/^[A-Za-z0-9_-]+$/.test(value))return false;
 try{
  const data=JSON.parse(Buffer.from(value,"base64url").toString("utf8"));
  if(typeof data.time!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(data.time)||!Number.isFinite(Date.parse(data.time))||typeof data.id!=="string"||!uuid.test(data.id))return false;
  return {time:data.time,id:data.id};
 }catch{return false;}
}
export function messageCursor(item:{id:string;cursor_time?:string;created_at:string|Date}){
 // SQL supplies microseconds so timestamp ties and page boundaries stay exact.
 return Buffer.from(JSON.stringify({time:item.cursor_time||new Date(item.created_at).toISOString(),id:item.id})).toString("base64url");
}

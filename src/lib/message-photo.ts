export const MAX_MESSAGE_PHOTO=5*1024*1024;
export function photoType(bytes:Uint8Array){
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if([137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return 'image/png';
 if(Buffer.from(bytes.subarray(0,4)).toString()==='RIFF'&&Buffer.from(bytes.subarray(8,12)).toString()==='WEBP')return 'image/webp';
 return null;
}
export async function readMessagePhoto(file:FormDataEntryValue|null){
 if(!(file instanceof File)||file.size===0||file.size>MAX_MESSAGE_PHOTO)throw Error('Izberi fotografijo JPG, PNG ali WebP do 5 MB.');
 const bytes=Buffer.from(await file.arrayBuffer());if(!photoType(bytes))throw Error('Izberi fotografijo JPG, PNG ali WebP.');return bytes;
}

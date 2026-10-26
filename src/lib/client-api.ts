export async function readApiResponse(response:Response){
 const message="Storitev trenutno ni dosegljiva. Poskusi znova čez trenutek.";
 if(!(response.headers.get("content-type")||"").includes("application/json"))throw new Error(message);
 let data;try{data=await response.json()}catch{throw new Error(message)}
 if(!data||typeof data!=="object"||Array.isArray(data))throw new Error(message);
 if(!response.ok||data.ok===false)throw new Error(typeof data.message==="string"?data.message:message);
 return data;
}
export async function api<T>(url:string,options?:RequestInit):Promise<T>{
 try{return await readApiResponse(await fetch(url,{cache:"no-store",...options})) as T}
 catch(error){if(error instanceof TypeError)throw new Error("Povezava je prekinjena. Preveri internet in poskusi znova.");throw error}
}
export const jsonOptions=(body:unknown,method="POST"):RequestInit=>({method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});

import JoskoClient from "./JoskoClient";
export default async function Page({searchParams}:{searchParams:Promise<{q?:string|string[]}>}){
 const params=await searchParams;
 const initialQuestion=typeof params.q==="string"?params.q.trim().slice(0,500):"";
 return <JoskoClient initialQuestion={initialQuestion}/>;
}

import ChatClient from "./ChatClient";
export default async function Page({searchParams}:{searchParams:Promise<{room?:string}>}){const {room}=await searchParams;const initialRoom=["general","social","help","market","lost-found"].includes(room||"")?room!:"general";return <ChatClient key={initialRoom} initialRoom={initialRoom}/>;}

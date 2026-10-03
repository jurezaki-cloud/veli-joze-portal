import type {Member} from "./domain";
export type PublicMember={id:string;displayName:string;nickname?:string;zone?:string};
export function toPublicMember(member:Member):PublicMember{
 return {id:member.id,displayName:member.displayName,...(member.nickname?{nickname:member.nickname}:{}),...(member.showZone?{zone:member.zone}:{})};
}

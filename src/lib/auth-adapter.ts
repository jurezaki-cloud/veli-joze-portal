import type {Role} from "./domain";
export type AuthIdentity={id:string;email:string;role:Role;approved:boolean};
export interface AuthAdapter{getIdentity(req:Request):Promise<AuthIdentity|null>;}
class DisabledAuthAdapter implements AuthAdapter{
 async getIdentity(req:Request){void req;return null;}
}
export function getAuthAdapter():AuthAdapter{
 // Replace only after AUTH_PROVIDER is configured and verified end-to-end.
 return new DisabledAuthAdapter();
}

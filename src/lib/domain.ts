export type Role="guest"|"member"|"moderator"|"admin";
export type Member={id:string;email:string;displayName:string;nickname?:string;zone:string;parcelPrivate:string;role:Role;approved:boolean;showZone:boolean;notifications:boolean;createdAt:string};
export type ChatRoom="general"|"social"|"help"|"market"|"lost-found";
export type ChatMessage={id:string;room:ChatRoom;authorId:string;body:string;createdAt:string;deletedAt?:string};
export type Report={id:string;authorId:string;category:string;location:string;description:string;status:"open"|"reviewing"|"closed";createdAt:string};
export type ModerationAction={id:string;moderatorId:string;targetType:"member"|"message"|"listing"|"report";targetId:string;action:string;createdAt:string};
export const privacy={publicMemberFields:["displayName","nickname"],conditionalMemberFields:["zone"],privateMemberFields:["email","parcelPrivate","role","approved","notifications"]} as const;

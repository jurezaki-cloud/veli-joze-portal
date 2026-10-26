export type PortalEvent={id:string;title:string;event_date:string;event_time:string;location:string;total:number};
export type PortalListing={id:string;title:string;price:string|null;category:string;sale_status:string;status:string;total:number};
export type PortalPost={id:string;title:string;board:"help"|"lost-found";status:string;reply_count:number;new_replies:number;total:number};
export type MyPortalData={ok:true;unread:number;events:PortalEvent[];favorites:PortalListing[];listings:PortalListing[];posts:PortalPost[];followed:PortalPost[];totals:Record<"events"|"favorites"|"listings"|"posts"|"followed",number>};

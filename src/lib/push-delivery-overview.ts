import {getDatabase} from "./database";
export type PushDeliveryCounts={waiting:number;exhausted:number;sent:number};
const active="m.approved and not m.blocked_permanent and (m.blocked_until is null or m.blocked_until<=now())";
export async function pushDeliveryOverview(){
 const result=await getDatabase().query<PushDeliveryCounts>(`select count(*) filter(where d.sent_at is null and d.attempts<3)::int waiting,count(*) filter(where d.sent_at is null and d.attempts>=3)::int exhausted,count(*) filter(where d.sent_at is not null)::int sent from push_deliveries d join members m on m.id=d.member_id where ${active}`);
 return result.rows[0]||{waiting:0,exhausted:0,sent:0};
}
export async function retryExhaustedPush(){
 const result=await getDatabase().query(`update push_deliveries d set attempts=0,last_attempt_at=null from members m where m.id=d.member_id and ${active} and d.sent_at is null and d.attempts>=3 and (d.last_attempt_at is null or d.last_attempt_at<now()-interval '5 minutes') returning d.notification_key`);
 return result.rowCount;
}

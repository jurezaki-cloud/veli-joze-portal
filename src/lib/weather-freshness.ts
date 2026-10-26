export type WeatherFreshness="fresh"|"stale"|"unknown";
// Provider timestamps without an offset are local to its returned utc_offset_seconds.
export function weatherFreshness(time:unknown,offset:unknown,now=Date.now()):WeatherFreshness{
 if(typeof time!=="string")return "unknown";
 let stamp:number;
 if(/(?:Z|[+-]\d{2}:\d{2})$/.test(time))stamp=Date.parse(time);
 else{
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(time)||typeof offset!=="number"||!Number.isFinite(offset)||Math.abs(offset)>50400)return "unknown";
  stamp=Date.parse(time+"Z")-offset*1000;
 }
 if(!Number.isFinite(stamp)||stamp>now+15*60*1000)return "unknown";
 return now-stamp>3*60*60*1000?"stale":"fresh";
}

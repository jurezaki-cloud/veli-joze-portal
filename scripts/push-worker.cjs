/* eslint-disable @typescript-eslint/no-require-imports -- Passenger startup uses CommonJS. */
const http=require('node:http');
const {createHmac}=require('node:crypto');
function attachPushWorker(server,{initialDelayMs=5000,intervalMs=60000}={}){
 if(!process.env.AUTH_SECRET||!process.env.VAPID_PRIVATE_KEY||!(process.env.VAPID_PUBLIC_KEY||process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)||!process.env.VAPID_SUBJECT)return;
 let busy=false,stopped=false,timer,interval;
 const token=createHmac('sha256',process.env.AUTH_SECRET).update('veli-joze-push-worker-v190').digest('hex');
 const run=()=>{if(stopped||busy)return;const address=server.address();if(!address)return;busy=true;
 const connection=typeof address==='string'?{socketPath:address}:{hostname:['0.0.0.0','::'].includes(address.address)?'127.0.0.1':address.address,port:address.port};
 const request=http.request({...connection,path:'/api/internal/push-drain',method:'POST',headers:{authorization:'Bearer '+token}},res=>{res.resume();res.on('end',()=>{busy=false})});request.setTimeout(85000,()=>request.destroy());request.on('error',()=>{busy=false});request.end();
 };
 server.once('listening',()=>{timer=setTimeout(run,initialDelayMs);timer.unref();interval=setInterval(run,intervalMs);interval.unref()});
 server.once('close',()=>{stopped=true;clearTimeout(timer);clearInterval(interval)});
}
module.exports={attachPushWorker};

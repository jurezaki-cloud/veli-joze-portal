/* eslint-disable @typescript-eslint/no-require-imports -- Passenger startup uses CommonJS. */
const http=require('node:http');
const {createHmac}=require('node:crypto');
function attachMailWorker(server,{initialDelayMs=5000,intervalMs=60000}={}){
 if(!process.env.AUTH_SECRET||!process.env.MAIL_FROM||!['resend','sendmail'].includes(process.env.MAIL_PROVIDER))return;
 let busy=false,stopped=false,timer,interval;
 const token=createHmac('sha256',process.env.AUTH_SECRET).update('veli-joze-mail-worker-v38').digest('hex');
 const run=()=>{if(stopped||busy)return;const address=server.address();if(!address)return;busy=true;
 const connection=typeof address==='string'?{socketPath:address}:{hostname:['0.0.0.0','::'].includes(address.address)?'127.0.0.1':address.address,port:address.port};
 const request=http.request({...connection,path:'/api/internal/mail-drain',method:'POST',headers:{authorization:'Bearer '+token}},res=>{res.resume();res.on('end',()=>{busy=false})});request.setTimeout(85000,()=>request.destroy());request.on('error',()=>{busy=false});request.end();
 };
 server.once('listening',()=>{timer=setTimeout(run,initialDelayMs);timer.unref();interval=setInterval(run,intervalMs);interval.unref()});
 server.once('close',()=>{stopped=true;clearTimeout(timer);clearInterval(interval)});
}
module.exports={attachMailWorker};

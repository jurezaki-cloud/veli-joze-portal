const CACHE="veli-joze-public-1.13.0-logo";
const OFFLINE="/offline.html";
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([OFFLINE,"/icons/veli-joze-v108-192.png"]))));
self.addEventListener("message",event=>{if(event.data?.type==="ACTIVATE_UPDATE")event.waitUntil(self.skipWaiting())});
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("veli-joze-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
 const u=new URL(event.request.url);
 if(event.request.method!=="GET"||u.origin!==self.location.origin||u.pathname.startsWith("/api/"))return;
 if(event.request.mode==="navigate"){
  event.respondWith(fetch(event.request).catch(async()=>{const cached=await caches.match(OFFLINE);return cached||new Response("Brez povezave. Ponovno odpri Veli Jože, ko bo internet dosegljiv.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}})}));return;
 }
 if(!(u.pathname.startsWith("/_next/static/")||u.pathname.startsWith("/icons/")||u.pathname==="/sea-banner.jpg"))return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)))}return response}).catch(()=>caches.match(event.request).then(hit=>hit||Response.error())));
});

self.addEventListener("push",event=>{let data={};try{data=event.data?.json()||{}}catch{data={title:"Veli Jože",body:event.data?.text()||"Novo obvestilo",href:"/moja-obvestila"}};event.waitUntil(self.registration.showNotification(data.title||"Veli Jože",{body:data.body||"Novo obvestilo",icon:"/icons/veli-joze-v108-192.png",badge:"/icons/veli-joze-v108-192.png",data:{href:data.href||"/moja-obvestila"}}))});
self.addEventListener("notificationclick",event=>{event.notification.close();let href="/moja-obvestila";try{const target=new URL(event.notification.data?.href||href,self.location.origin);if(target.origin===self.location.origin)href=target.href}catch{};event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{for(const c of list){if("focus" in c){c.navigate(href);return c.focus()}}return clients.openWindow(href)}))});

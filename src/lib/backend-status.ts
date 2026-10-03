export function backendStatus(){
 const required=["AUTH_PROVIDER","DATABASE_URL","AUTH_SECRET"] as const;
 const missing=required.filter(k=>!process.env[k]);
 return {configured:missing.length===0,missing};
}

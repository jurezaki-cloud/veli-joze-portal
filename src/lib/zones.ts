export const zones=[{value:"rumena",label:"Rumena cona"},{value:"rdeca",label:"Rdeča cona"},{value:"modra",label:"Modra cona"},{value:"zelena",label:"Zelena cona"}] as const;
export function zoneLabel(value:string|null|undefined){return zones.find(x=>x.value===value)?.label||"Cona ni izbrana"}
export function validZone(value:unknown){return typeof value==="string"&&zones.some(x=>x.value===value)}

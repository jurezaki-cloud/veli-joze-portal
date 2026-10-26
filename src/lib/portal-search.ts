export const searchCategories=[
 {value:"all",label:"Vse"},{value:"announcement",label:"Obvestila"},{value:"event",label:"Dogodki"},
 {value:"listing",label:"Oglasi"},{value:"help",label:"Pomoč med sosedi"},{value:"lost-found",label:"Izgubljeno / najdeno"}
] as const;
export type SearchCategory=typeof searchCategories[number]["value"];
export type SearchResult={id:string;kind:Exclude<SearchCategory,"all">;title:string;body:string;detail:string;status:string;created_at:string;href:string};
export function normalizeSearch(value:string){return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d")}
export function searchExcerpt(body:string,query:string){
 const normalized=normalizeSearch(body),tokens=normalizeSearch(query).split(/\s+/).filter(Boolean);
 const indexes=tokens.map(word=>normalized.indexOf(word)).filter(i=>i>=0),start=indexes.length?Math.max(0,Math.min(...indexes)-60):0;
 return `${start?"… ":""}${body.slice(start,start+240)}${body.length>start+240?" …":""}`;
}

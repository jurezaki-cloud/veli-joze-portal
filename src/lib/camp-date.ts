/** Camp dates always show the year, including next-season events. */
export function formatCampDate(value:string,month:"short"|"long"="short"){
 const date=new Date(value.length===10?value+"T12:00:00Z":value);
 return Number.isNaN(date.getTime())?"Datum ni na voljo":date.toLocaleDateString("sl-SI",{timeZone:"Europe/Zagreb",day:"numeric",month,year:"numeric"});
}

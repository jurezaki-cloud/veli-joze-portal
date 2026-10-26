import {weatherFreshness} from "./weather-freshness";
export type WeatherData={ok:true;source:string;timezone:string;updatedAt:string;marineUpdatedAt:string|null;freshness:{air:string;marine:string};current:{time?:string;temperature_2m?:number;wind_speed_10m?:number;wind_direction_10m?:number;precipitation?:number};marine:{time?:string;sea_surface_temperature?:number;wave_height?:number;wave_direction?:number;wave_period?:number}|null};
const location="latitude=45.49&longitude=13.49&timezone=Europe%2FZagreb";
/** Public fixed-location data only. Freshness is recalculated for every response. */
export async function publicWeather(timeoutMs=8000):Promise<WeatherData>{
 const [air,sea]=await Promise.allSettled([
  fetch(`https://api.open-meteo.com/v1/forecast?${location}&current=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation`,{next:{revalidate:600},signal:AbortSignal.timeout(timeoutMs)}).then(async r=>{if(!r.ok)throw new Error("Weather upstream unavailable");return r.json()}),
  fetch(`https://marine-api.open-meteo.com/v1/marine?${location}&current=sea_surface_temperature,wave_height,wave_direction,wave_period`,{next:{revalidate:600},signal:AbortSignal.timeout(timeoutMs)}).then(async r=>{if(!r.ok)throw new Error("Marine upstream unavailable");return r.json()})
 ]);
 if(air.status!=="fulfilled"||!air.value.current)throw new Error("Vremenski podatki trenutno niso dosegljivi. Poskusi ponovno.");
 const marine=sea.status==="fulfilled"?sea.value:null;
 return {ok:true,source:"Open-Meteo",timezone:"Europe/Zagreb",updatedAt:air.value.current.time,marineUpdatedAt:marine?.current?.time||null,freshness:{air:weatherFreshness(air.value.current.time,air.value.utc_offset_seconds),marine:weatherFreshness(marine?.current?.time,marine?.utc_offset_seconds)},current:air.value.current,marine:marine?.current||null};
}

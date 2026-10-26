import WeatherClient from "./WeatherClient";
import {publicWeather} from "@/lib/public-weather";
export const dynamic="force-dynamic";
export default async function Page(){const data=await publicWeather(2500).catch(()=>null);return <WeatherClient initialData={data}/>}

import {publicWeather} from "@/lib/public-weather";
import WeatherSummary from "./WeatherSummary";
export default async function WeatherSummaryServer(){const data=await publicWeather(2500).catch(()=>null);return <WeatherSummary initialData={data}/>}

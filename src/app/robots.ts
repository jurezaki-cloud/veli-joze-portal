import type {MetadataRoute} from "next";
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:"*",allow:["/","/api/gallery/*"],disallow:["/api/"]},sitemap:"https://www.veli-joze.eu/sitemap.xml"};}

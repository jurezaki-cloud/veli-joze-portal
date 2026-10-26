import type { Metadata } from "next";

/** Canonical HTTPS origin. Only change after verifying a domain migration. */
export const SITE_ORIGIN = "https://www.veli-joze.eu";

type SeoConfig = {
  title: string;
  description: string;
  indexable: boolean;
  inSitemap: boolean;
};

/**
 * Deliberate allowlist for search visibility.
 * Public pages with demo/unfinished content are omitted from sitemap pending review.
 * A robots meta tag is NEVER an authorization control.
 */
export const SEO_ROUTES = {
  "/": { title: "Veli Jože Savudrija – Portal pavšalistov", description: "Neuradni portal pavšalistov Kampa Veli Jože v Savudriji z informacijami, pomočjo in povezavami skupnosti.", indexable: true, inSitemap: true },
  "/admin": { title: "Administracija – Veli Jože", description: "Administrativni del portala skupnosti Veli Jože.", indexable: false, inSitemap: false },
  "/dogodki": { title: "Dogodki in druženja – Veli Jože Savudrija", description: "Dogodki, druženja in informacije za skupnost pavšalistov Kampa Veli Jože.", indexable: true, inSitemap: false },
  "/galerija": { title: "Galerija – Veli Jože Savudrija", description: "Fotografije in poletni spomini skupnosti Veli Jože v Savudriji.", indexable: true, inSitemap: false },
  "/informacije": { title: "Kamp Veli Jože – Informacije za pavšaliste", description: "Praktične informacije o bivanju, storitvah in življenju v Kampu Veli Jože v Savudriji.", indexable: true, inSitemap: true },
  "/joze-ai": { title: "JOŽE AI – Veli Jože", description: "Pomočnik skupnosti pavšalistov Kampa Veli Jože.", indexable: false, inSitemap: false },
  "/kam-danes": { title: "Kam danes v Savudriji – Veli Jože", description: "Ideje za izlete, plaže, restavracije in doživetja v okolici Savudrije.", indexable: true, inSitemap: false },
  "/klepet": { title: "Klepet pavšalistov – Veli Jože", description: "Klepet skupnosti pavšalistov Kampa Veli Jože.", indexable: false, inSitemap: false },
  "/obvestila": { title: "Obvestila skupnosti – Veli Jože", description: "Pomembna obvestila in novosti skupnosti pavšalistov Veli Jože.", indexable: true, inSitemap: false },
  "/oglasi": { title: "Mali oglasi – Veli Jože", description: "Mali oglasi skupnosti pavšalistov Veli Jože.", indexable: false, inSitemap: false },
  "/pavsalisti": { title: "Pavšalisti – Veli Jože", description: "Članski del skupnosti pavšalistov Veli Jože.", indexable: false, inSitemap: false },
  "/prijava": { title: "Prijava – Veli Jože", description: "Varna prijava v članski portal pavšalistov Veli Jože.", indexable: false, inSitemap: false },
  "/profil": { title: "Moj profil – Veli Jože", description: "Upravljanje osebnega profila v portalu Veli Jože.", indexable: false, inSitemap: false },
  "/registracija": { title: "Registracija – Veli Jože", description: "Registracija za člane skupnosti pavšalistov Kampa Veli Jože.", indexable: false, inSitemap: false },
  "/sos": { title: "SOS in nujni kontakti – Veli Jože Savudrija", description: "Pomembne številke za nujno pomoč in uporabni kontakti za območje Savudrije.", indexable: true, inSitemap: true },
  "/tezave": { title: "Prijavi težavo – Veli Jože", description: "Obrazec za prijavo težav v skupnosti pavšalistov Veli Jože.", indexable: false, inSitemap: false },
  "/vreme": { title: "Vreme in morje – Savudrija", description: "Informacije o vremenu in razmerah na morju v okolici Kampa Veli Jože.", indexable: true, inSitemap: false },
  "/zemljevid": { title: "Zemljevid kampa – Veli Jože Savudrija", description: "Orientacijske informacije in zemljevid območja Kampa Veli Jože.", indexable: true, inSitemap: false },
} as const satisfies Record<string, SeoConfig>;

export type SeoPath = keyof typeof SEO_ROUTES;

export function absoluteSeoUrl(path: SeoPath): string {
  return new URL(path, SITE_ORIGIN).toString();
}

export function pageMetadata(path: SeoPath): Metadata {
  const page = SEO_ROUTES[path];
  const url = absoluteSeoUrl(path);
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: url },
    robots: { index: page.indexable, follow: page.indexable },
    openGraph: {
      type: "website",
      locale: "sl_SI",
      siteName: "Veli Jože",
      url,
      title: page.title,
      description: page.description,
    },
    twitter: { card: "summary", title: page.title, description: page.description },
  };
}

/** Conservative sitemap allowlist; no fabricated lastModified timestamps. */
export const sitemapPaths = (Object.keys(SEO_ROUTES) as SeoPath[])
  .filter((path) => SEO_ROUTES[path].inSitemap);

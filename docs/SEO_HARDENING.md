# Veli Jože SEO Hardening — predprodukcijski pregled

## Obseg
- Vsaka App Router stran ima lasten title, description, canonical, OG in robots meta.
- `/robots.txt` in `/sitemap.xml` ustvarja Next.js MetadataRoute.
- Kanonična domena: `https://www.veli-joze.eu`. Preusmeritev apex -> www ostane nespremenjena.
- `robots.txt` ne blokira noindex strani, saj mora iskalnik oznako noindex prebrati.
- Članske in administratorske strani imajo noindex/nofollow. **To ni nadomestilo za avtorizacijo.**
- Sitemap je namenoma omejen na `/`, `/informacije`, `/sos`, saj so nekatere druge javne strani v tej veji demonstracijske.
- Ohranjen je trenutni indeksacijski status drugih javnih strani; niso na novo označene noindex.
- Ni sprememb prijav, OAuth, API, podatkovne baze, uporabnikov, pravic ali strani.

## Preverjanje
```bash
npm ci
npm run test:seo
npm run lint
npm run build
```

Pred združitvijo v main in objavo:
1. Preveriti, ali je GitHub main res ista različica kot aktualna produkcija.
2. Preveriti 200 na /robots.txt in /sitemap.xml, valjaven XML in vključene indekse.
3. Preveriti canonical/title/description/og:url/robots na dejanskih HTML odzivih javnih in zasebnih strani.
4. Preveriti HTTP/HTTPS in www/non-www preusmeritve brez zank.
5. V Google Search Console pregledati konkretne izključene URL-je ter preveriti pričakovane noindex/redirect statuse.
6. Ponovno preveriti delovanje prijav, OAuth, sej, pravic ter zasebnih vsebin.
7. Šele po pregledu resnične produkcijske vsebine razširiti sitemap.

Brez produkcijske objave ali samodejne zahteve za indeksiranje.

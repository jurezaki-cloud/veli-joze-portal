# Veli Jože – predprodukcijska varnostna vrata (26. 10. 2026)

**Stanje: NO-GO za združitev in objavo.** Samo bralni pregled produkcije: 96 preverjanj, 94 uspešnih in 2 neuspešni preusmeritvi HTTP→HTTPS. Ta dokument opisuje preizkuse, ne izvaja sprememb na strežniku, DNS ali v podatkovni bazi.

## Potrjena produkcijska konfiguracija (neprijavljen obiskovalec)

- HTTPS domača stran, javne strani, `robots.txt` in `sitemap.xml` so dosegljivi.
- Sitemap trenutno vsebuje 17 javnih URL-jev, vsi preverjeni URL-ji imajo self-canonical in `index, follow`.
- Vseh 9 preverjenih zaščitenih API-jev brez sejnega piškotka vrne **401**.
- Članske strani imajo `noindex, nofollow`, neveljavni ID-ji dogodkov in obvestil vrnejo `404` in `noindex`.
- HTTPS strežnik pošilja HSTS, CSP, X-Content-Type-Options, Referrer-Policy, X-Frame-Options.
- **P0 BLOKER**: `http://www.veli-joze.eu/` in `http://www.veli-joze.eu/prijava` vrneta **200 OK prek nezaščitenega HTTP**, ne trajne preusmeritve na HTTPS. Na HTTP poslani HSTS ne ščiti prvega HTTP obiska.
- Apex `http://veli-joze.eu/` in `https://veli-joze.eu/` pravilno vrneta 308 na `https://www.veli-joze.eu/`.

## Kako urediti P0 na NEOSERV LiteSpeed / cPanel (brez samodejnega posega)

1. Pred spremembami arhiviraj delujočo konfiguracijo gostovanja/virtualnega gostitelja in preveri, da je certifikat veljaven za `www.veli-joze.eu`.
2. V **cPanel > Domains** preveri domenski vnos za `www.veli-joze.eu` oziroma pripadajočo glavno/poddomeno. Kjer je na voljo, omogoči **Force HTTPS Redirect**. Če je stran dostavljena prek Node.js reverse proxyja in ta nastavitev ne vpliva na `www` gostitelja, naj NEOSERV uredi preusmeritev **na ravni LiteSpeed/proxy** (pred Next.js). Ne dodajaj slepih pravil v .htaccess, ki bi povzročila zanko.
3. Obvezno ohrani cilj URL, pot in query parametre ter obstoječo preusmeritev domene brez `www`.
4. Preveri: `curl -I http://www.veli-joze.eu/` in `curl -I http://www.veli-joze.eu/prijava` morata vrniti 301 ali 308 s ciljem HTTPS; `https://www.veli-joze.eu/` mora ostati 200. Preizkusi tudi prijavo, Google OAuth callback in PWA.
5. Če po posegu pride do napake 5xx ali preusmeritvene zanke, povrni shranjeno **strežniško nastavitev**. Brez posega v podatkovno bazo.
6. Tega trenutno **nisem spreminjal**. Za izvedbo je potrebno preveriti dejansko nastavitev in načrtovano vzdrževalno okno.

Uradna dokumentacija: https://docs.cpanel.net/cpanel/domains/domains/

## Ponovljivi samo bralni pregled

```bash
node scripts/qa-production-readonly.mjs
```

Skripta ne uporablja prijavnih podatkov, sejnih piškotkov ali mutacijskih zahtevkov. Zahteva največ tri sočasne preglede URL-jev v sitemapu in vrne ne-ničelno kodo ob neuspehu. **Namerno ni del CI gradnje**, ker je dejanski produkcijski strežnik neodvisna zunanja komponenta. Izhod ni dokaz celovite varnosti, le preverjenih HTTP lastnosti.

## Nadaljnji pogoji za odobritev izdaje

- Potrdi, da arhiv 1.14.1 res ustreza zadnji produkcijski kodi (manifest 1.14.1 sam ni zadosten dokaz).
- PR #2 (obnova kode) in odvisni PR #3 (varnostne odvisnosti) morata ostati osnutka do sprejetega načrta; PR #1 ne uporabljaj za deploy, ker vsebuje starejši in krajši sitemap.
- Preveri obnovljivo varnostno kopijo **dejanske produkcijske baze in konfiguracije** (ne le obstoj ZIP datoteke).
- Na testnem okolju s kopijo anonimizirane baze preizkusi celoten login, registracijo, Google OAuth, odjavo, ponastavitev gesel, moderator/admin pravice, sporočila, push, galerijo, GDPR izvoz in migracije.
- Na ravni strežnika odpravi HTTP→HTTPS, ponovno preveri 17 spletnih URL-jev ter Google Search Console opozorili na konkretnih prizadetih URL-jih.
- Brez samodejnega zagona migracij, brisanja podatkov, merge v main ali objave na produkcijo.

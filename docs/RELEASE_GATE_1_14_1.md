# Veli Jože – predprodukcijska varnostna vrata (26. 10. 2026)

**Stanje: HTTP→HTTPS popravljeno 26. 10. 2026; ostaja NO-GO za združitev in novo izdajo zaradi drugih predprodukcijskih pogojev.** Ponovljen samo bralni pregled: **96/96 PASS**. Ta dokument opisuje preizkuse, ne izvaja sprememb na strežniku, DNS ali v podatkovni bazi.

## Potrjena produkcijska konfiguracija (neprijavljen obiskovalec)

- HTTPS domača stran, javne strani, `robots.txt` in `sitemap.xml` so dosegljivi.
- Sitemap trenutno vsebuje 17 javnih URL-jev, vsi preverjeni URL-ji imajo self-canonical in `index, follow`.
- Vseh 9 preverjenih zaščitenih API-jev brez sejnega piškotka vrne **401**.
- Članske strani imajo `noindex, nofollow`, neveljavni ID-ji dogodkov in obvestil vrnejo `404` in `noindex`.
- HTTPS strežnik pošilja HSTS, CSP, X-Content-Type-Options, Referrer-Policy, X-Frame-Options.
- **P0 ODPRAVLJEN (26. 10. 2026)**: `http://www.veli-joze.eu/` in `http://www.veli-joze.eu/prijava` sedaj vrneta **301** na HTTPS. Pot in query parametri se ohranijo; HTTPS strani vrneta 200.
- Apex `http://veli-joze.eu/` vrne **301** na `https://veli-joze.eu/`, nato **308** na `https://www.veli-joze.eu/`. Brez zank, končna stran 200.
- Uporabnik je v cPanel omogočil Force HTTPS Redirect za povezano poddomeno in po varnostni kopiji `.htaccess` dodal začasno pravilo `[R=302]` pred Passenger nastavitvami. Zunaj se vrača 301; brez dodatnega dostopa ni mogoče potrditi, katera strežniška plast izda 301. Nadaljnje spreminjanje trenutno ni potrebno.

## Izvedeni popravek in kontrolni postopek za prihodnje regresije

1. Pred spremembami arhiviraj delujočo konfiguracijo gostovanja/virtualnega gostitelja in preveri, da je certifikat veljaven za `www.veli-joze.eu`.
2. V **cPanel > Domains** preveri domenski vnos za `www.veli-joze.eu` oziroma pripadajočo glavno/poddomeno. Kjer je na voljo, omogoči **Force HTTPS Redirect**. Če je stran dostavljena prek Node.js reverse proxyja in ta nastavitev ne vpliva na `www` gostitelja, naj NEOSERV uredi preusmeritev **na ravni LiteSpeed/proxy** (pred Next.js). Ne dodajaj slepih pravil v .htaccess, ki bi povzročila zanko.
3. Obvezno ohrani cilj URL, pot in query parametre ter obstoječo preusmeritev domene brez `www`.
4. Preveri: `curl -I http://www.veli-joze.eu/` in `curl -I http://www.veli-joze.eu/prijava` morata vrniti 301 ali 308 s ciljem HTTPS; `https://www.veli-joze.eu/` mora ostati 200. Preizkusi tudi prijavo, Google OAuth callback in PWA.
5. Če po posegu pride do napake 5xx ali preusmeritvene zanke, povrni shranjeno **strežniško nastavitev**. Brez posega v podatkovno bazo.
6. Popravek je izvedel uporabnik v NEOSERV cPanel in `.htaccess` z varnostno kopijo. Ponovljena avtomatska preverjanja so **96/96 PASS**. Ureditev ostane v nadzoru gostovanja, brez posega v podatkovno bazo.

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
- HTTP→HTTPS je odpravljeno in 17 javnih URL-jev preverjenih. Opozorila Google Search Console je treba še povezati s konkretnimi prizadetimi URL-ji.
- Brez samodejnega zagona migracij, brisanja podatkov, merge v main ali objave na produkcijo.

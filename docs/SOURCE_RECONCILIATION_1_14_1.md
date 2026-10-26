# Veli Jože 1.14.1 – pregled izvorne kode (HOLD)

## Izvor
- Lokalni arhiv: `Desktop/STRAN VELI JOZE/veli-joze-1.14.1-INSTALL.zip`
- Uvoz izključno iz mape `IZVORNA-KODA/` (432 datotek, približno 7,33 MB).
- Arhiv je iz 9. 10. 2026. Objavljena produkcija je bila preverjena 26. 10. 2026; prisotnost manifesta 1.14.1 še ni dokaz popolne identičnosti kode.
- Brez kopiranja baz, zasebnih ključev, .env, nastavitev DNS, strežniških skrivnosti ali vsebine runtime-v1141.
- Obstoječi GitHub main ostane nespremenjen.

## Kaj ima arhiv, česar stari GitHub main nima
- Javne podrobnosti dogodkov in obvestil, dinamični sitemap in izboljšan robots.txt.
- Individualni SEO metapodatki, canonical in JSON-LD, slike za deljenje.
- Članska funkcionalnost, napredna obvestila, zasebna sporočila, moderiranje, galerija, GDPR ter PWA.
- Obstoječa testna zbirka 45 sklopov in PostgreSQL migracije.

## Preverjanje 26. 10. 2026
- Na Windows/Node 24: 31/45 testnih sklopov uspešnih; 14 neuspešnih.
- Veliko neuspešnih testov uporablja lastni testni nalagalnik TypeScript modulov in simulirane uporabnike; preveriti je treba prenosljivost Windows/Linux, ne popuščati preverjanja pravic v produkciji.
- Test JOŠKO AI uporablja časovno občutljivo pričakovanje že preteklega dogodka.
- Pred združitvijo obvezna Linux GitHub Actions validacija, test prijave/odjave in pravic, primerjava produkcijskih API-jev, varnostni pregled, preverjanje migracij in arhiviranja.
- Koda uporablja Next.js 16.3.8; npm audit je na starejši GitHub veji opozoril na kritično ranljivost Next.js in visoko ranljivost Zod. Na izvorni kodi 1.14.1 ponoviti audit.
- Ta PR je zgolj osnutek izvorne razvojne osnove, NI izdaja in NI pripravljen za samodejno združitev.

## Pred združitvijo
1. Zbrati in primerjati dejansko trenutno produkcijsko izvorno kodo z 1.14.1.
2. Odpraviti vse regresije testov v izolirani razvojni veji; ne spreminjati varnostnih pravic na slepo.
3. Ponoviti `npm ci`, `npm test`, `npm run lint`, `npm run build`.
4. Pripraviti ločeno, testirano varnostno nadgradnjo odvisnosti.
5. Validirati vsak javni URL, sitemap, robots, canonical, zasebne strani ter E2E in načrt povrnitve.
6. Šele po izrecni odločitvi za izdajo razmišljati o merge in produkciji.

## STOP
**Ne združi in ne objavi, dokler pregled ni zaključen.**

# Veli Jože – Portal pavšalistov

Neuradni portal skupnosti pavšalistov Kampa Veli Jože v Savudriji.

## Lokalni zagon
```bash
npm install
npm run dev
```
Odpri http://localhost:3000.

## Preverjanje pred izdajo
```bash
npm run lint
npm run build
```
API `/api/readiness` mora pred produkcijskim vklopom vrniti `ready: true`, nato je obvezen še end-to-end test.

## Produkcijski priklop
1. Pripravi namensko PostgreSQL bazo in uporabi `db/schema.sql`.
2. Izberi in priklopi pravi `AUTH_PROVIDER`.
3. Nastavi močan `AUTH_SECRET` (najmanj 32 znakov).
4. Priklopi shared/distributed rate limiter in nastavi `RATE_LIMIT_PROVIDER`.
5. Če bo omogočena Google prijava, nastavi `GOOGLE_CLIENT_ID` in `GOOGLE_CLIENT_SECRET`.
6. Preveri registracijo, prijavo, odjavo, seje, pravice member/moderator/admin in odobritev pavšalista.
7. Preveri zapis/bralne poti za klepet, oglase, težave, obvestila, dogodke in profil.
8. Preveri backup + restore baze.
9. Šele po uspešnem E2E testu odstrani DEMO oznake in omogoči produkcijske write akcije.
10. Nato priklopi končno domeno/NEOSERV DNS in HTTPS.

## PWA
Manifest: `/manifest.webmanifest`
Service worker: `/sw.js`
Aplikacija uporablja standalone prikaz in mobilno navigacijo.

## Varnost
Produkcijskih skrivnosti se ne zapisuje v Git. Podrobnosti so v `PRODUCTION_SECURITY.md`.

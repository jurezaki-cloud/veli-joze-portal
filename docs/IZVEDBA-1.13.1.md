# Veli Jože 1.13.1 – popravki po analizi

Osnova je izvorna koda paketa 1.13.0. Obstoječi računi, objave, fotografije, nastavitve in zgodovina niso odstranjeni. Nova migracija baze ni potrebna.

## Izvedeno

- F01: naslov Piškotki in lokalna shramba pravilno vsebuje š.
- F02: opis sessionStorage osnutkov in ključev ponovitev, signalov localStorage ter predpomnilnika. Nova različica obvestila 2026-10-09-v2. Gumb za ročno brisanje osnutkov; odjava počisti osnutke in signali obvestijo druge odprte zavihke. Ob strežniško potrjeni menjavi računa se prejšnji lokalni osnutki počistijo.
- F03: domači dogodek in JOŠKO pokažeta leto; dogodki za naslednjo sezono niso več dvoumni.
- F04: Naloži starejša sporočila v sobah in zasebnih pogovorih. Stran vsebuje do 100 zapisov. Nadaljevanje uporablja čas z mikrosekundami in ID, da ne izpusti sporočil z enakim časom. Osveževanje zadnje strani ohrani že naloženo starejšo zgodovino. Starejša zgodovina se znova preveri ob ponovnem odprtju pogovora; periodično se osvežuje zadnja stran.
- F05: fotografije klepeta in zasebnih sporočil dobijo lasten ključ ponovitve. Sočasna ali ponovljena enaka zahteva ustvari eno fotografijo. Spremenjene fotografije, sobe ali prejemniki z istim ključem se zavrnejo; odstranjene fotografije se ne oživijo. Stari klient brez ključa ostane podprt, zato za novo zaščito sprejmi posodobitev PWA. Brskalnik hrani le prstni odtis fotografije in ključ, ne fotografije. Po ponovnem odprtju zavihka je treba isto datoteko ponovno izbrati. Če lokalna shramba ni dosegljiva, se ključ ohrani samo v pomnilniku odprte strani; po osvežitvi je varna ponovitev omejena.
- F06: ohranjen namensko javni seznam odobrenih članov. Profil in politika izrecno pojasnjujeta javnost izbranega imena, opisa in dovoljene cone. E-pošta in parcela ostajata zasebni, profilne slike zaščitene. Odgovor imenika ima no-store, da sprememba vidnosti ne ostane v predpomnilniku. Nobena nastavitev vidnosti ni samodejno vključena.
- F07: HSTS, nosniff, Referrer-Policy, SAMEORIGIN in osnovni CSP. Polnejša politika CSP je v Report-Only in še ni strogo uveljavljena za skripte. Prikaz Next.js v odzivnem headerju je odstranjen. Ni zagotovila celovite zaščite pred vsemi napadi; po namestitvi preveri, da gostovanje headerje ohrani.
- Dodaten dejanski popravek: filter con zdaj uporablja rumena/rdeca/modra/zelena, tako kot API, namesto angleških vrednosti. Seznam članov pokaže napako in omogoči ponovni poskus namesto neobravnavane izjeme.
- Zasebni seznam pogovorov prekine prejšnjo zahtevo in prezre prepozne odgovore; izgubljena prijava počisti prikaz zasebnega pogovora.

## Preverjanje

Regresijski testi in novi testi fotografskih ponovitev, 150 zapisov znotraj ene milisekunde, dostopov, osnutkov ter dejanskih obrazcev. Testi uporabljajo izolirane identitete in PGlite; ne pošiljajo produkcijskih sporočil, e-pošte ali push obvestil. Preverjeni so lint, produkcijska gradnja in zagon sestavljenega paketa na Node 22.23.3. Natančni rezultati so v test-results.txt, lint-results.txt, build-results.txt in startup-results.txt.

## Namestitev NEOSERV

1. Shrani kopijo aplikacije in baze. Ohrani runtime-v1130 ter veli-start-1.13.0.cjs za povratek.
2. Celotni INSTALL ZIP razpakiraj v isti Application root kot prej. Ne odstranjuj .env, okolja, uporabniških datotek, starega runtime ali starih statičnih datotek. Paket ne vsebuje produkcijskih skrivnosti.
3. Application startup file: veli-start-1.13.1.cjs. Node 22.23.3, Production. Save in Restart. npm install za ta pripravljeni paket ni potreben.
4. Če domena statične datoteke bere iz ločenega www/public_html, vsebino WWW-ANDROID-FIX razpakiraj tudi tja, tako kot pri prejšnjih izdajah. To ne nadomesti Node Application root.
5. Preveri /api/health: version 1.13.1. Header X-Veli-Joze-Deployment mora začeti z 1.13.1-. Osveži portal in sprejmi ponujeno PWA-posodobitev.
6. Preveri prijavo, obe vrsti sporočil, fotografije, filter con, datum dogodka, odjavo in stran o piškotkih.

## Povratek

Nastavi Application startup file nazaj na veli-start-1.13.0.cjs, nato Save/Restart. Ohranjen runtime-v1130 je potreben. Ker ta izdaja ne spreminja sheme in ne briše podatkov, za običajen povratek aplikacije ni potrebna povratna migracija. Varnostno kopijo baze obnavljaj le, če je potrebno, in upoštevaj nove zapise, nastale po kopiji.

## Obvezni prevzem v produkciji

Prijavo, Google OAuth, pošto, push, članske ter administratorske postopke je treba potrditi na dejanskem gostovanju. Obnova produkcijskih varnostnih kopij, mobilne naprave, celovita dostopnost, Core Web Vitals in Search Console niso preverjeni s tem paketom. Ne spreminjaj baze ali računov zgolj za preizkus; uporabi ločeno testno okolje za posege. Priloženi OPERATIVNI-PREVZEM.txt določa kratko kontrolo in kriterije.

Dogodki in oglasi še nimajo zaščite pred ponovitvijo po izgubljenem odgovoru. Zaščita te izdaje pokriva besedilna sporočila in fotografije obeh vrst pogovorov.

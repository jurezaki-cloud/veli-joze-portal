# Veli Jože 1.12.0 — izvedbeni načrt in začetna nadgradnja

Datum: 8. 10. 2026. Izhodišče: veli-joze-1.11.2-INSTALL.zip.
Status: pripravljen INSTALL 1.12.0 z omejenim, preverjenim obsegom popravkov. Produkcijska objava ni izvedena. Preostale faze spodaj so načrt nadaljnjega dela.

## 1. Pregled obstoječe kode

Paket vsebuje izvorno kodo, produkcijski runtime in različice PWA sredstev. Pregledani so package.json, adapter baze, avtentikacija, API iskanja, JOŠKO, zdravstveni preverjanji, skupni bralnik API ter testni sklopi.

Tehnologije po kodi: Next.js 16.3.8, React 19.2.8, TypeScript, PostgreSQL prek pg, jose za seje, sharp za slike in web-push. To je popis paketa, ne preverjanje aktualnosti različic. Dejanska produkcijska konfiguracija ni dostopna. Starejših navedb MySQL zato ne uporabljamo za načrt migracije.

| Področje | Prisotno v kodi | Obvezna zaščita pri nadgradnji |
| --- | --- | --- |
| Računi | Lokalna in Google prijava, registracija, potrditev e-pošte, ponastavitev gesla | Obstoječe seje, odobritev članov, blokade in vloge |
| Skupnost | Klepet, zasebna sporočila, fotografije, pomoč, izgubljeno/najdeno | Dostop samo upravičenim članom, zasebnost fotografij |
| Vsebina | Obvestila, dogodki, prijave, oglasi, ankete, galerija | Odobritve, arhiviranje, lastništvo in stanje oglasov |
| Osebni pregled | Moj portal, parcela, obvestila, nastavitve | Uporabnik vidi samo svoje podatke |
| Upravljanje | Člani, moderacija, galerija, zasebnost | Pooblastila preverjena tudi na API |
| Pomoč | JOŠKO, informacije, SOS, zemljevid, vreme | Preverjeni viri, jasno označena nedosegljivost |
| Dostopnost | PWA, manifesti, service worker, SEO | Brez zasebnih podatkov v offline predpomnilniku |

Prisotnost funkcije ni dokaz pravilnega delovanja. Polno regresijsko in produkcijsko preverjanje ostaja pogoj izdaje.

## 2. Cilj in obseg 1.12.0

Predlagani obseg je zanesljivejša vsakodnevna uporaba: jasna nova vsebina, predvidljivo obveščanje, boljši mobilni pregled in preverljive informacije. Večje preoblikovanje prijave ali zamenjava baze nista del tega načrta.

### Faza A — vzpostavitev preverjenega izhodišča (P0)

1. Ohraniti nespremenjen paket 1.11.2 in ločeno delovno kopijo.
2. Namestiti odvisnosti z npm ci iz obstoječega zaklepa; uporabiti razvojno bazo, brez produkcijskih podatkov.
3. Pognati npm test, npm run lint in npm run build; zapisati napake pred nadaljnjimi spremembami.
4. Potrditi vloge gost, čakajoči član, odobreni član, moderator in administrator.
5. Preveriti dejanski način zagona na NEOSERV ter ujemanje naloženega paketa s produkcijo.

Rezultat: preverjeno izhodišče in seznam ponovljivih napak. Brez tega ne zaključiti izdaje.

### Faza B — odzivi API in stanje strani (P0; začeta)

1. Skupni bralnik API naj loči uspeh, napako strežnika, neveljaven JSON in prekinjeno povezavo.
2. Preveriti vse porabnike API in uskladiti prikaz praznega stanja, napake ter gumba za ponovni poskus.
3. Ob osveževanju ohraniti že prikazane podatke in jasno povedati, če svežih ni mogoče dobiti.
4. Preveriti počasne odgovore in preklic pri menjavi strani; samodejno ne ponavljati zapisovalnih zahtev.

Merila: uporabnik nikjer ne vidi »Unexpected token«; napaka ene kartice ne prekine celotnega pregleda; neuspel zapis ni prikazan kot uspešen.

### Faza C — Moj portal in obvestila (P1)

1. Pregledati existing my-portal, personal-overview, new-since ter notification-feed in uporabiti obstoječe vire.
2. Po pomembnosti razporediti osebne novosti, pomembna obvestila in prihajajoče prijavljene dogodke.
3. Uskladiti števec neprebranih z dejanjem »prebrano« in osveževanjem med zavihki.
4. Preveriti nastavitve e-pošte/push ter preprečiti podvojene dostave za isti dogodek.

Merila: števec po branju pravilno izgine in se po osvežitvi ne vrne; zasebna vsebina drugega člana ni dostopna; neuspešna dostava ostane preverljiva v čakalni vrsti.

### Faza D — mobilna uporabnost in dostopnost (P1)

1. Preveriti glavne poti na širinah 360, 390, 768 in 1440 px.
2. Skrajšati osebni pregled s primarnimi dejanji v prvem zaslonu; preveriti dolga imena, naslove in besedila.
3. Urediti fokus, oznake obrazcev, uporabo tipkovnice in gumbe za upravljanje fotografij.
4. Preveriti Android nameščeno aplikacijo in iPhone Safari, zlasti povratek iz navodil namestitve.

Merila: brez vodoravnega drsenja in prekrivanja spodnje navigacije; ohranjen vnos po napaki; jasna povratna informacija po oddaji.

### Faza E — JOŠKO in aktualnost informacij (P1)

1. Ohraniti povezave do preverjenih virov in oznako časa preverjanja.
2. Preveriti vprašanja za danes/jutri/vikend v časovnem pasu Europe/Zagreb.
3. Preveriti izključevanje arhiviranih obvestil in preteklih dogodkov.
4. Pri vremenu prikazati izvor in čas podatka; zastarel podatek ne sme izgledati kot nova meritev.

Merila: JOŠKO ne izmišlja cen, kontaktov ali vsebine zasebnih pogovorov; izpad baze se razlikuje od praznega seznama.

### Faza F — priprava izdaje (P0)

1. Celotna regresija po zaključnih spremembah, lint in produkcijski build.
2. Če so migracije potrebne, dodati ločen SQL, preveriti ponovni zagon in varnostno kopijo. Trenutna začetna sprememba ne potrebuje migracije.
3. Uskladiti package, health/status, zagonski skript, manifest in service worker na 1.12.0 šele ob potrjeni izdaji.
4. Izdelati nov standalone runtime in preveriti prisotnost statičnih datotek ter public.
5. Pripraviti INSTALL z navodili, seznamom sprememb in povratkom na prejšnji runtime.
6. Po namestitvi preveriti /api/health, prijavo, osnovne strani, eno dovoljeno testno oddajo in PWA.

Merila: delujoč build, uspešni obvezni testi, potrjena baza in prijava; noben razvojni paket ni predstavljen kot produkcijsko preverjen.

## 3. Že izvedene spremembe

- src/lib/client-api.ts: odgovor API v obliki polja ni več sprejet kot veljaven objekt. Pogodba veljavnih objektnih odgovorov ostane enaka.
- tests/client-api.test.cjs: preverja veljaven odgovor, HTML 500, pokvarjen JSON, null, polje, številko, sporočilo napake, aplikacijsko napako pri HTTP 200, offline, preklic, cache in JSON zahteve.
- scripts/test-all.mjs: odkrije vse tests/*.test.cjs, izvede vsak sklop ter vrne neuspešen izhod, če kateri odpove. Ne skrije manjkajočih odvisnosti.
- package.json: dodana npm test in npm run test:client-api; različica in odvisnosti nespremenjene.

## 4. Dejanska validacija — posodobljeno

Odvisnosti so nameščene z npm ci iz obstoječega package-lock.json. Skupni zagon vseh 24 takrat prisotnih sklopov: 24 uspešnih, 0 neuspešnih. Pozneje dodan test centra obvestil je prav tako uspešen: skupaj je preverjenih 25 sklopov. Testi uporabljajo izolirane identitete in PGlite razvojno bazo, ne produkcijske baze.

Popravljena je priprava razvojne baze v accounts.test.cjs: dodana obstoječa migracija v42.sql, ki jo uporablja notification-feed. Sprememba ne posega v produkcijsko shemo.

Lint: uspešen, brez napak; 8 obstoječih opozoril (neuporabljene spremenljivke v testih in slike v klepetu/sporočilih). CommonJS zagonski skripti in SEO test imajo pojasnjene lokalne izjeme za require. Globalna pravila niso sproščena.

Produkcijska gradnja in TypeScript preverjanje: uspešna tudi po dodatni spremembi centra obvestil.

Lokalni standalone smoke: /api/health 200, /moj-portal 200, /api/my-portal in /api/notifications za gosta 401. To preverja zagon in zavrnitev dostopa, ne vizualnega videza ali produkcijske prijave.

### Dodatno izvedeno v nadaljevanju

- Moj portal med osveževanjem ohrani zadnji uspešni pregled; dodan je gumb Osveži pregled in status osveževanja.
- Ob napaki je jasno označeno, da je prikazan prejšnji pregled; ob 401/403 se osebni podatki odstranijo.
- Center obvestil ohrani prejšnji pregled ob začasni napaki; odjava ali izguba odobritve počisti vsebino in nastavitve.
- Center obvestil prekliče prejšnjo zahtevo in jo prekliče tudi ob zapustitvi strani. Starejši odgovor ne prepiše novejšega.
- Dodana regresijska testa portal-refresh in notification-refresh preverjata osveževanje, izpad, zavrnitev dostopa in tekmujoče zahteve.

Produkcija, .env in uporabniški podatki niso spremenjeni. Izvorna koda je v IZVORNA-KODA. Za gostovanje uporabi celoten INSTALL in veli-start-1.12.0.cjs; izvorna mapa sama ni namestitev.

## 5. Naslednji konkretni korak

Odvisnosti in osnovna regresija so zdaj urejene. Naslednje delo: uskladitev števcev obvestil med zavihki, pregled dostav ter mobilna vizualna validacija; nato zaključek izdaje in nov standalone INSTALL. Pred nadgradnjo runtime zagotoviti varnostno kopijo baze, uporabniških naloženih datotek in trenutne konfiguracije; ne prepisati .env.

## Priprava namestitve

Vsi 25 testni sklopi so uspešni tudi po uskladitvi oznake 1.12.0. Build in lint sta uspešna (8 obstoječih opozoril). V INSTALL so vključeni standalone runtime, statične datoteke, public in zagonski skript z nadzorom BUILD_ID. Produkcijska baza in prijavljeni tokovi na gostovanju ostajajo nepreverjeni.

## Nadaljevanje 1.12.1 — obvestila med zavihki

Dodana je različena shema signala localStorage brez zasebnih podatkov. Sporočila, prebrana obvestila, opomini, prijave na dogodke in potrjen pregled novosti objavijo signal po uspešni spremembi. Sprejemnik v navigaciji pretvori signal v lokalni dogodek; dogodka ne posreduje naprej, zato ni kroženja. Moj portal in center obvestil osvežita pregled po dogodku in ob ponovnem prikazu zavihka. Branje podatkov samo ne objavlja signala. Pri nedostopnem localStorage ostaneta lokalno osveževanje in osveževanje ob vrnitvi v zavihek.

Zagonska datoteka: veli-start-1.12.1.cjs. Obstoječi runtime 1.12.0 lahko ostane za povratek. Vizualni pregled v resničnem brskalniku z dvema zavihkoma in produkcijska prijava še nista izvedena.

## Nadaljevanje 1.12.2 — ozki zasloni in dostopnost

Spremembe CSS so omejene na osebne preglede. Dolgi naslovi in povezave se lomijo; kartice se lahko skrčijo v mreži. Zavihki in kontrolni gumbi imajo najmanj 44 px višine ter vidno označen fokus. Registracija, podatkovna baza in API ostajajo nespremenjeni. Zagonska datoteka: veli-start-1.12.2.cjs.

### Preverjanje 1.12.2

26 testnih sklopov uspešnih. Brskalniški pregled s sintetičnimi odgovori API: Moj portal in Center obvestil na 360, 390, 768 in 1440 px; brez vodoravnega drsenja, zavihki vsaj 44 px visoki, vidni fokus. Posnetki in izpis so v mobile-qa ter mobile-qa-results.txt. To ni preverjanje produkcijske baze ali fizičnega iPhona. Oznaka v nogi je usklajena z izdajo.

## 1.12.4 — JOŠKO pri delnem izpadu

Odgovor ohrani povezave do dosegljivih virov, opozori na nedosegljive vire in označi nepopoln pregled. Iskanje po imenu ob izpadu ne sklepa, da podatka ni. Statični odgovori o uporabi portala in urnikih ostanejo neodvisni od baze. Testi vključujejo delni izpad ter imenovan dogodek ob popolnem izpadu. Ni migracije baze.

## 1.12.5 — pregled dostav push

Moderatorski center ima ločen pregled že zabeleženih dostav za odobrene, neblokirane člane. Moderator in administrator lahko vrneta izčrpane poskuse v obdelavo po vsaj 5 minutah. Dostavljeni zapisi in tekoči zadnji poskus niso ponastavljeni. Obstoječi delavec ponovno preveri neprebranost in upravičenost; HTTP ukrep samo pripravi obdelavo. Gost in član nimata dostopa. Ni nove migracije baze; uporabi se že vključena v190. Podatki naprav in vsebina sporočil se v pregledu ne razkrivajo. Dejanska dostava na produkcijsko napravo ni preverjena.

## 1.12.6 — svež pregled domače strani
Domača stran ob dogodkih spremembe obvestil in pregleda novosti osveži strežniške podatke. Zaporedni dogodki se združijo; skriti zavihek počaka do vrnitve. Ob odstranitvi komponente se poslušalci in časovnik odstranijo. Brez nove migracije baze. Preveriti dogodke, združevanje, skriti zavihek in odstranitev komponente ter celoten nabor testov in gradnjo.

## 1.12.7 — osnutki in pošiljanje
Besedilni osnutki klepeta in zasebnih sporočil se shranijo v sessionStorage, ločeno po računu in sobi oziroma sogovorniku. Če shramba ni dosegljiva, ostane pomnilniška rezerva. Fotografije se ne shranjujejo. Osnutek se odstrani po potrjenem uspehu, tudi če uporabnik medtem zapusti pogovor; novejši osnutek se ohrani. Takojšnja zaklepanje mutacij prepreči ponovljen klik pred izrisom stanja gumba.
Preverjanje: testi ločenosti osnutkov, osvežitve modula, nedostopne shrambe, zaščite novejšega besedila in dejanskih submit handlerjev ob podvojenem kliku ter zavrnitvi. Celotni regresijski testi, lint, gradnja in zagon Node 22.23.3. Brez nove migracije baze.
Fotografije imajo leno nalaganje, odpiranje večje slike in jasno možnost ponovnega nalaganja ob napaki. Naslednji korak: preverjanje pogovorov z resničnima računoma na telefonu. Ponovni poskus po prekinitvi povezave ima še vedno lahko dvoumen izid; pred ponovnim pošiljanjem preveri pogovor. Strežniška idempotentnost ni vključena v to izdajo.

## 1.12.8 — zaščita dogodkov in oglasov
Takojšnja zaščita pred podvojenim oddajanjem in spremembami dogodkov/oglasov; obrazec ob napaki ostane odprt in omogoči ponovni poskus. Pokrito z dejanskimi submit handlerji. Brez migracije baze.

## 1.12.9 — sveže prijave na dogodke
Ohranitev zadnjih podatkov ob izpadu z opozorilom in onemogočenimi spremembami do uspešne osvežitve. Odstranitev osebnih podatkov ob 401/403. Osvežitev ob spremembah obvestil, vrnitvi na stran in ponovni povezavi; brez oddajanja novih signalov iz nalaganja. Takojšnja zaščita prijave/odjave pred ponovljenim klikom. Preveriti izpad, izgubo dostopa, zastarele odgovore, dogodke osveževanja, čiščenje poslušalcev in dvojni klik. Brez migracije baze.

## 1.12.10 — veljavnost seznama udeležencev
Seznam javnih imen iz Kdo pride je vezan na točno določen potrjen nabor prijav. Takoj se skrije ob nalaganju, napaki, izgubi dostopa ali odstranitvi dogodka. Po uspešni osvežitvi je potreben ponoven odprt seznam; tudi pozni odgovor starega zahtevka ne razkrije zastarelega seznama. Izpeljano stanje brez dodatnih poslušalcev ali časovnikov. Preverjanje dejanskega izrisa v vseh navedenih stanjih, regresijski testi, lint, gradnja in Node 22.23.3. Brez migracije baze.

## 1.12.11 — zaključek veje 1.12
Združeni popravki 1.12.0–1.12.10; usklajene oznake paketa, API health, noge, PWA in predpomnilnika. Odstranjeni neuporabljeni uvozi iz šestih testnih datotek. Brez novih uporabniških funkcij in brez migracije baze. Končni regresijski nabor, lint brez napak/opozoril, gradnja in zagon na Node 22.23.3, pregled celovitosti INSTALL ZIP. Prevzem na produkciji in obseg naslednje izdaje sta v ZAKLJUCEK-1.12-IN-NACRT-1.13.0.md.

## Prehod na 1.13.0
Izvedena strežniška zaščita ponovnih poskusov za besedilna sporočila; brez nove migracije, uporablja se obstoječi primarni ključ. Podrobnosti, preverjanje, povratek in meje izdaje so v IZVEDBA-1.13.0.md. Fotografije in objave ostanejo naslednji korak.

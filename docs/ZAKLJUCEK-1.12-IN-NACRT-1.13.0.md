# Zaključna izdaja 1.12.11 in prehod na 1.13.0

1.12.11 zaključuje stabilizacijo veje 1.12. Vključuje prejšnje popravke; ne spreminja sheme baze. Samostojen INSTALL vsebuje runtime, zagonsko datoteko, javne datoteke, izvorno kodo in testna poročila. Node za gostovanje: 22.23.3.

## Vključeno

| Področje | Končno vedenje |
|---|---|
| Moj portal in obvestila | Osveževanje med zavihki; ohranitev prikaza ob izpadu, odstranitev zasebnih podatkov ob izgubi dostopa |
| Domača stran | Osvežitev pregleda po spremembah obvestil |
| Klepet in zasebna sporočila | Besedilni osnutki v istem zavihku, ločeni po računu in pogovoru; zaščita pred ponovljenim klikom |
| Fotografije sporočil | Večji prikaz, leno nalaganje, možnost ponovnega nalaganja |
| Dogodki in oglasi | Takojšnja zaščita pred podvojenimi zahtevami; ohranitev obrazca ob napaki |
| Prijave na dogodke | Osveževanje ob vrnitvi, spremembah in ponovni povezavi; zastarelo stanje onemogoči spremembe |
| Kdo pride | Imena so vidna samo za trenutni potrjeni nabor prijav |
| Vreme | Ločena časa zraka in morja, opozorila za stare ali nepreverljive podatke |
| JOŠKO | Ohranitev preverjenih virov in opozorilo na delni izpad |
| Push administracija | Agregatni pregled in ponovni poskus izčrpanih dostav z varovalnim razmikom |

## Prevzem po namestitvi

Ti koraki zahtevajo resnična računa in produkcijsko okolje. Lokalni testi jih ne nadomeščajo.

1. Shrani varnostno kopijo aplikacije in baze. Ohrani trenutni runtime in startup file za povratek.
2. Razpakiraj celoten INSTALL; ohrani `.env`, okoljske spremenljivke in uporabniške datoteke. Startup file: `veli-start-1.12.11.cjs`. Save in Restart.
3. Preveri `/api/health`: različica mora biti `1.12.11`. Potrdi posodobitev PWA.
4. Z dvema računoma preveri klepet, zasebno sporočilo in fotografijo. Osnutek naj preživi osvežitev; drug račun ga ne sme prikazati.
5. Preberi obvestilo v drugem zavihku in preveri števec doma ter center obvestil.
6. Prijavi in odjavi dogodek; preveri Moje dogodke in ponovno odprtje Kdo pride.
7. Po odjavi v drugem zavihku se vrni na prvotnega: zasebni podatki in seznam udeležencev se morajo skriti po preverjanju dostopa.
8. Preveri objavo/urejanje oglasa ter Na voljo, Rezervirano in Prodano; z moderatorjem preveri urejanje in arhiviranje dogodka.
9. Preveri vreme, odgovor JOŠKA in dovoljenja za pregled push. Dejanski push preveri na svoji napravi.
10. Preveri telefon in nameščeno PWA. Šele nato potrdi produkcijski prevzem veje 1.12.

## Predlagani obseg 1.13.0

| Korak | Izvedba | Merilo uspeha |
|---|---|---|
| 1. Zanesljivi ponovni poskusi | Strežniška idempotentnost za sporočila in objave: ključ zahtevka vezan na člana, operacijo in vsebino; atomarna obdelava in ponovitev istega rezultata | Prekinitev povezave po shranitvi in ponovni poskus ne ustvarita nove objave |
| 2. Zasebni pogovori | Strani starejših sporočil in prikaz stanja prenosa; ohranitev osnutkov | Pregled starejših sporočil ne izgubi novega besedila in ne podvoji vrstic |
| 3. Fotografije | Preverjanje izgube povezave, dovoljenj in mobilnega prikaza | Uporabnik jasno vidi uspeh oziroma napako in lahko varno nadaljuje |
| 4. Celoten prevzem | Preverjanje z dvema računoma, moderatorjem in telefonom | Brskalnik → API → baza → ponovno nalaganje prikazujejo iste podatke |

Pred spremembo baze pripraviti migracijo, preskus na kopiji in postopek povratka. Obstoječa zaščita gumba sama ne zagotavlja idempotentnosti pri ponovnem poskusu po omrežni napaki. Do 1.13.0 po dvoumnem izidu najprej preveri pogovor oziroma seznam.

Produkcijska baza, SMTP, dejanska dostava push in fizične naprave v tej pripravi niso preverjeni. Dokument ne potrjuje produkcijskega prevzema.

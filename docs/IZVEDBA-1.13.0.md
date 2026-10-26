# 1.13.0 — varni ponovni poskusi besedilnih sporočil

Klepet in zasebna besedilna sporočila zdaj uporabljajo ključ poskusa. Isti ključ, član in vrsta sporočila določijo isti ID; obstoječi primarni ključ baze atomarno prepreči podvojeno shranjevanje. INSERT ob konfliktu ne spreminja starega sporočila. Ločen naslednji SELECT vrne prvotno sporočilo po preverjanju avtorja, sogovornika oziroma sobe, vsebine in moderiranja.

Ponovitev vrne HTTP 200 in isti ID. Prva objava vrne 201. Spremenjena vsebina ali soba/sogovornik z istim ključem vrne 409. Odstranjeno sporočilo ni obnovljeno ali ponovno razkrito. Neveljaven ključ vrne 400. Zahteve brez ključa ostanejo združljive s prejšnjimi odjemalci.

Odjemalec ohrani ključ istega besedila v istem zavihku tudi po osvežitvi. Ob potrjeni uspešni pošiljki ključ odstrani; nov nameren zapis istega besedila dobi nov ključ. Spremenjeno besedilo dobi nov ključ. Potrditev starega poskusa ne odstrani novejšega ključa. Če sessionStorage ni dosegljiv, ključ preživi le v pomnilniku do ponovnega nalaganja.

## Preverjanje

- Izolirana PGlite baza z obstoječimi migracijami: sočasna zahteva, izgubljen odgovor in ponovitev ustvarijo eno vrstico in isti ID v obeh vrstah pogovora.
- Konflikt vsebine, napačen ključ, ločitev avtorja in vrste pogovora ter moderatorska odstranitev.
- Ključi preživijo osvežitev modula, sprememba besedila ustvari nov ključ, uspeh odstrani samo ustrezni ključ; preverjen je tudi osnutek z veliko ubežnimi znaki.
- Prejšnji regresijski testi, lint, gradnja in zagon z Node 22.23.3; poročila v INSTALL.

## Namestitev in povratek

Nova migracija baze ni potrebna. Pred namestitvijo shrani aplikacijo in bazo. Ohrani .env, uporabniške datoteke, runtime-v11211 in veli-start-1.12.11.cjs. Novi startup file je veli-start-1.13.0.cjs. Po Save/Restart preveri /api/health in posodobitev PWA.

Z dvema računoma preveri novo sporočilo ter ohranitev osnutka ob napaki. Za preverjanje izgubljenega odgovora v testnem okolju prekini odgovor po shranitvi in ponovi isto zahtevo z istim clientRequestId; mora vrniti isti ID in eno vrstico. Ob potrebi vrni startup na predhodno različico; podatki ostanejo združljivi.

## Meje izdaje in naslednji korak

Zaščita velja za besedilna sporočila. Fotografije, dogodki in oglasi v tej izdaji še nimajo strežniške zaščite za ponovne poskuse po prekinitvi povezave. Obstoječa zaščita pred hitrimi ponovljenimi kliki ostane vključena. Spremenjeno besedilo predstavlja novo zahtevo; v primeru negotovega izida prejšnjega sporočila ga pred spremembo preveri v pogovoru.

Naslednji korak: razširitev istega pravila na fotografije in objave, nato pregled starejših zasebnih sporočil. Produkcijska baza, prijavljeni uporabniki in dejanski push/SMTP niso preverjeni.

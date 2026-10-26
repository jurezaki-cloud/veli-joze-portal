# Veli Jože 1.14.1 – varnostna nadgradnja odvisnosti (Draft / HOLD)

## Spreminja se samo dobavna veriga
- `next`: 16.3.8 → **16.4.3** (odstranjena prijavljena kritična ranljivost iz `npm audit`).
- `eslint-config-next`: 16.3.8 → **16.4.3**, zaradi skladnosti s Next.js.
- Posodobljen `package-lock.json`, tudi ranljiva posredna odvisnost `zod` na popravljeno različico.
- Dodan ločen read-only CI workflow za audit, teste, lint in build.

## Lokalni pregled (26. 10. 2026)
- Po posodobitvi `npm audit --audit-level=high`: **0 zaznanih ranljivosti**.
- `npm audit --omit=dev`: **0 zaznanih ranljivosti**.
- `npm run lint`: **PASS**, 2 obstoječi opozorili v testu seo141.
- `npm run build`: **PASS** (Next.js 16.4.3, webpack, TypeScript).
- `npm test` na Windows/Node 24 je že v izvorni veji imel okoljsko odvisne napake; Linux CI na obnovitveni veji PR #2: **45/45 PASS**.

## Meje in odvisnosti
- PR za varnost je odvisen od **PR #2 (obnovitev 1.14.1)**. Najprej je treba urediti izvorno vejo, šele nato nadgradnjo.
- Brez sprememb OAuth, uporabniških pravic, poštnih ali push skrivnosti, produkcijske baze, domen in strežnika.
- Pred kakršno koli izdajo ponovno testirati prijave, zasebnost, Next.js nadgradnjo, PWA, galerijo, API-je in produkcijsko okolje.
- Pregled `npm audit` ne nadomesti penetracijskega preverjanja in ne dokazuje varnosti strežnika.

**Ne združi in ne objavi, dokler CI in ročni QA nista potrjena.**

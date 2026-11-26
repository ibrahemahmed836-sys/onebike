# Onebike – webbutik

Statisk, responsiv webbutik för **Onebike MC Sweden AB** – MC-utrustning för motorcykel, motocross och snöskoter.
Byggd för GitHub Pages: ren HTML, CSS och JavaScript utan byggsteg.

**Live:** https://ibrahemahmed836-sys.github.io/onebike/

## Innehåll

| Sida | Fil |
|---|---|
| Startsida med kreativ scroll (pinnad start, horisontell kategoribana, visir-spotlight, zoom) | `index.html` |
| Kategori, varumärke, sökresultat, säsongsrensning | `kategori.html?c=<kategori>` · `kategori.html?q=<sökord>` |
| Produktsida (galleri, färger, storlekar, beskrivning, relaterat) | `produkt.html?p=<produkt>` |
| Nyheter | `nyheter.html` |
| Reservdelar | `reservdelar.html` |
| Alla kategorier · Varumärken | `kategorier.html` · `varumarken.html` |
| Presentkort · Favoriter · Kassa · Mitt Onebike | `presentkort.html` · `favoriter.html` · `kassa.html` · `konto.html` |
| Kundservice och informationssidor | `kundservice.html`, `om-oss.html`, `hur-handlar-jag.html`, `kopvillkor.html`, `retur.html`, `storleksguide.html`, `integritet.html` |

- **3 618 produkter** och **213 kategorier** i `data/products.json` och `data/categories.json`.
- Produktbeskrivningar i `data/desc/00–63.json` (laddas bara på produktsidan).
- Filter på märke, storlek, färg, lagerstatus och pris; sortering; ”visa fler” med automatisk laddning.
- Sök i hela sortimentet direkt i sidhuvudet.
- Varukorg, favoriter och senast visade sparas i webbläsaren (localStorage).
- Mobil först: bottenark för filter och snabbköp, fast köpknapp på produktsidan, meny med underkategorier.

## Verktyg för förare

| Funktion | Var | Hur den fungerar |
|---|---|---|
| Hitta rätt storlek | `storleksguide.html` | Huvudmått + huvudform → hjälmstorlek. Sparas och markeras på varje hjälm. |
| Hitta rätt visir | `hitta-visir.html` | Märke → modell → visir, pinlock och solvisir. Bygger på ”Passar …” i tillverkarens text (`data/compat.json`). |
| Skydd & certifiering | produktsidor, filter | ECE 22.06, EN 17092-klass, skyddsnivå, Pinlock, solvisir, intercom-redo, skalmaterial, vikt – bara när texten säger det. |
| Recensioner med passform | produktsidor | Betyg, storlek och längd. Skickas till butiken för granskning och visas direkt för skribenten. |
| Mitt garage | `reservdelar.html#garage`, `konto.html` | Märke, modell, årsmodell → delar som passar visas först och märks ”Passar din MC”. |
| Bygg ditt kit | `kit.html` | Körstil → en produkt per steg → hela kitet i varukorgen. Klädguide efter temperatur för snöskoter. |
| Jämför hjälmar | `jamfor.html` | Upp till tre hjälmar sida vid sida. |
| Boka D-Air service | `d-air.html` | Bokningsförfrågan med önskad dag, referensnummer och kalenderfil. |
| Påminnelser | `konto.html` | Hjälmbyte (förslag 5 år) och D-Air-service som kalenderfil (.ics). |
| Bevaka pris & lager | produktsidor | Bevakning per storlek, skickas till butiken och sparas under Mitt Onebike. |
| Smart sök | överallt | Stavfel, synonymer på svenska och engelska, ”Menade du …”. |
| Säsong | startsidan | Nov–mars: snöskoter först. Testa med `?season=winter` / `?season=summer`. |
| Engelska | `en/` | Hela gränssnittet på engelska. Produktbeskrivningar och juridiska texter visas på svenska. |
| App | `manifest.webmanifest`, `sw.js` | Kan installeras på hemskärmen och fungerar delvis offline. |

Startsidans stora bilder är korta videor (Seedance 2.5 via Magnific) som spolas med scrollen: `assets/vid/` – full version för dator och lättare `-m`-version för mobil. Ingen video vid ”minska rörelse”, ”spara data” eller långsam uppkoppling.

## Scrollkoncept

En fristående konceptsida där scrollen styr kameran genom sex filmade scener (Hem, Motorcykel, Motocross, Snöskoter, Tillbehör, Outlet) med fem utvalda produkter per kategori: `scroll/` · https://ibrahemahmed836-sys.github.io/onebike/scroll/

## Bra att veta

- **Kitrabatt 10 %** när minst 4 delar köps som kit är ett förslag. Ändra `OB.KIT` i `assets/js/site.js` (sätt `pct: 0` för att stänga av) innan lansering.
- **Bokningar, bevakningar och recensioner** skickas till butiken via e-post och sparas i webbläsaren. Automatisk status, utskick och publicering kräver ett bokningssystem, ett e-postverktyg och moderering.
- **Pushnotiser** kräver en server och ingår inte; appen kan installeras och fungerar delvis offline.
- **Kassan** skickar beställningen till `info@onebike.se` via kundens e-postprogram. För riktig kortbetalning, Klarna eller Swish behöver en betalleverantör (till exempel Stripe, Klarna Checkout eller Svea) kopplas in.
- **Nyhetsbrev och kontaktformulär** öppnar ett förifyllt e-postmeddelande. Byt till ett formulärverktyg eller ett nyhetsbrevsverktyg när det finns.
- **Produktbilder** hämtas från butikens bild-CDN (`cdn.starwebserver.se` med flera). Kategori- och märkesbilder ligger i `assets/lv/`.
- **Mjuk scroll** med [Lenis](https://github.com/darkroomengineering/lenis) (MIT) i `assets/vendor/`. Allt rörligt stängs av för besökare som valt minskad rörelse.

## Struktur

```
assets/css/site.css    gemensam stil
assets/css/home.css    startsidans scener
assets/js/site.js      sidhuvud, meny, sök, varukorg, favoriter, cookies
assets/js/home.js      startsidans scrollmotor
assets/js/listing.js   kategorilistor och filter
assets/js/product.js   produktsidan
assets/js/pages.js     övriga sidor
data/                  produkter, kategorier, beskrivningar
```

© 2026 Onebike MC Sweden AB · Org.nr 559101-3866

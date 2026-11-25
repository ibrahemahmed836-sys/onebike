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

## Bra att veta

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

# Útmutató a weboldal bővítéséhez

Ez a dokumentum leírja, hogyan kell új fizikai kísérlet alkalmazást felvenni a weboldalra,
és hogyan épül fel a projekt szerkezete.

---

## Könyvtárszerkezet

```
fizikaikiserletek/
├── index.html          # Főoldal – az alkalmazások listája
├── manifest.json       # PWA manifest a főoldalhoz
├── sw.js               # Service Worker a főoldalhoz
├── assets/
│   ├── style.css       # Közös stílusok
│   ├── main.js         # QR-kód generálás + SW regisztráció
│   └── icons/
│       ├── icon-192.png   # Főoldal ikonja (192×192 px PNG!)
│       └── icon-512.png   # Főoldal ikonja (512×512 px PNG!)
├── apps/
│   └── <app-neve>/     # Minden alkalmazás saját mappában
│       ├── index.html
│       ├── manifest.json
│       ├── sw.js
│       └── ...
├── WEBSITE.md          # Ez a fájl
└── CLAUDE.md           # Claude Code útmutató
```

> **Fontos:** A `assets/icons/` mappában SVG fájlok vannak placeholder-ként.
> A PWA telepítéshez ezeket **PNG formátumra kell cserélni** (ld. lent).

---

## Ikonok elkészítése

A `manifest.json` PNG ikonokat vár. A legegyszerűbb módszer:

1. Nyisd meg az SVG fájlokat böngészőben, vagy használj online konvertert
   (pl. [svgtopng.com](https://svgtopng.com/))
2. Exportáld `icon-192.png` (192×192) és `icon-512.png` (512×512) méretben
3. Mentsd a fájlokat az `assets/icons/` mappába
4. Frissítsd a `manifest.json`-ban a `"src"` mezőket `.svg` → `.png`-re (már `.png`-re mutat)

---

## Új alkalmazás hozzáadása

### 1. Hozz létre egy mappát az `apps/` könyvtárban

```
apps/<alkalmazas-neve>/
```

Névkonvenció: kisbetűk, kötőjel elválasztással (pl. `apps/inga/`, `apps/ejtest/`).

### 2. Az alkalmazás fájljai

Minden alkalmazásnak szüksége van legalább:

| Fájl | Leírás |
|------|--------|
| `index.html` | Az alkalmazás főoldala |
| `manifest.json` | PWA manifest (ld. sablon lent) |
| `sw.js` | Service Worker (ld. sablon lent) |
| `icons/icon-192.png` | App ikon (192×192 px) |
| `icons/icon-512.png` | App ikon (512×512 px) |

#### manifest.json sablon

```json
{
  "name": "Alkalmazás neve",
  "short_name": "Rövid név",
  "description": "Rövid leírás magyarul",
  "start_url": ".",
  "scope": ".",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a237e",
  "lang": "hu",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

#### sw.js sablon

```javascript
const CACHE = '<app-neve>-v1';
const PRECACHE = ['.', 'index.html', 'manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
```

### 3. Vedd fel a főoldalra (`index.html`)

Az `index.html`-ben keresd meg az `<!-- APP KÁRTYÁK -->` kommentet,
és adj hozzá egy új `<article class="app-card">` elemet.
Az üres állapot jelzőt (`<p class="empty-state">`) töröld ki, ha már van legalább egy kártya.

```html
<article class="app-card">
  <div class="app-info">
    <h2 class="app-title">Alkalmazás neve</h2>
    <p class="app-desc">Rövid leírás az alkalmazásról.</p>
    <a class="app-link" href="apps/<app-neve>/">Megnyitás →</a>
  </div>
  <div class="app-qr">
    <canvas class="qr-canvas"
      data-url="https://<FELHASZNÁLÓNÉV>.github.io/fizikaikiserletek/apps/<app-neve>/"></canvas>
    <p class="qr-label">QR-kód az alkalmazáshoz</p>
  </div>
</article>
```

Cseréld ki a `<FELHASZNÁLÓNÉV>` részt a GitHub felhasználónevedre.

> **QR-kód** automatikusan generálódik a `data-url` attribútumból,
> JavaScript segítségével (`qrcodejs` könyvtár, CDN-ről töltődik be).

---

## GitHub Pages beállítása

1. GitHub-on nyisd meg a repo **Settings → Pages** oldalát
2. Source: `Deploy from a branch`
3. Branch: `master` (vagy `main`), mappa: `/ (root)`
4. Mentés után az oldal elérhetővé válik:
   `https://<FELHASZNÁLÓNÉV>.github.io/fizikaikiserletek/`

> Ha egyéni domaint szeretnél, adj hozzá egy `CNAME` fájlt a repo gyökerébe a domain névvel.

---

## PWA telepítés tesztelése

1. Nyisd meg az alkalmazást Chrome/Edge böngészőben mobilon (vagy asztali gépen)
2. Chrome DevTools → **Application** fül:
   - **Manifest**: ellenőrizd, hogy betölt-e
   - **Service Workers**: ellenőrizd a regisztrációt
   - **Cache Storage**: ellenőrizd a cache tartalmát
3. Lighthouse audit → **PWA** kategória

---

## Cache verzió frissítése

Ha egy alkalmazást frissítesz, növeld a `sw.js`-ben a cache verziószámot:

```javascript
// Régi:
const CACHE = 'inga-v1';
// Új:
const CACHE = 'inga-v2';
```

Ez kényszeríti a böngészőt, hogy töltse le az új verziókat.

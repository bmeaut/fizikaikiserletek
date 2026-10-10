# Specifikáció: Fizikai Kísérletek Hub (főoldal)

## Célkitűzés
Statikus GitHub Pages webhely, amely gyűjti az összes fizikai kísérlet PWA alkalmazást.
Mobil eszközökre optimalizált, magyar nyelvű.

## Telepítés
- GitHub Pages, repo gyökeréből (`master` branch, `/ (root)`)
- Nincs build lépés, nincs csomagkezelő
- URL: `https://<felhasználónév>.github.io/fizikaikiserletek/`

## Fájlszerkezet
```
/
├── index.html          # Főoldal
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker (cache-first az assetekre)
├── assets/
│   ├── style.css       # Közös stílusok (CSS változók, light/dark mód)
│   ├── main.js         # QR-kód generálás + lightbox + SW regisztráció
│   └── icons/          # icon-192.png, icon-512.png (SVG placeholder → PNG)
└── apps/
    └── <app-neve>/     # Minden alkalmazás saját almappában
```

## Főoldal (index.html) felépítése
- `<header>`: cím + alcím
- `.intro`: rövid leírás a PWA-król
- `#app-grid`: alkalmazás-kártyák rácsa (`.app-card` elemek)
- `<footer>`: GitHub link

## Alkalmazás-kártya (`.app-card`)
```html
<article class="app-card">
  <div class="app-info">
    <h2 class="app-title">Emoji + Cím</h2>
    <p class="app-desc">Rövid leírás.</p>
    <a class="app-link" href="apps/<neve>/">Megnyitás →</a>
  </div>
  <div class="app-qr">
    <canvas class="qr-canvas" data-url="https://<user>.github.io/fizikaikiserletek/apps/<neve>/"></canvas>
    <p class="qr-label">QR-kód az alkalmazáshoz</p>
  </div>
</article>
```

## QR-kód generálás
- Könyvtár: `qrcode-generator@1.4.4` (CDN: jsDelivr)
- `main.js` minden `.qr-canvas[data-url]` elemet `<img>`-re cserél (`createDataURL`)
- Kattintásra lightbox nyílik (teljes képernyős overlay, Escape/kattintás zárja)

## PWA (főoldal)
- `manifest.json`: `display: standalone`, `lang: hu`, ikonok: `assets/icons/icon-192.png`, `icon-512.png`
- `sw.js`: install → PRECACHE lista cache-elése; fetch → cache-first (saját origin), network-first navigációhoz

## Stílusok (style.css)
- CSS változók: `--color-bg`, `--color-surface`, `--color-primary`, `--color-primary-light`, `--color-text`, `--color-text-muted`, `--color-border`, `--radius`, `--shadow`
- Dark mode: `@media (prefers-color-scheme: dark)` felülírja a változókat
- Reszponzív: `max-width: 900px` center, `@media (max-width: 480px)` → kártya oszlopos elrendezés, kisebb QR

## Új alkalmazás hozzáadása
Lásd: `WEBSITE.md`

## Ikonok
SVG placeholder van; PWA installálhatósághoz PNG szükséges (192×192, 512×512).
`manifest.json` már `.png`-re mutat.

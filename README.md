# Fizikai Kísérletek

Mobil PWA alkalmazások fizikai kísérletekhez — tantermi és bemutató használatra.

## Az oldalról

A webhely ([GitHub Pages](https://bmeaut.github.io/fizikaikiserletek/)) fizikai kísérletekhez
készült progresszív webalkalmazásokat (PWA) gyűjt össze. Az alkalmazások okostelefonra
telepíthetők és internet-kapcsolat nélkül is működnek.

## Alkalmazások

| Alkalmazás | Leírás | Típus |
|------------|--------|-------|
| [Tapadási együttható mérő](apps/surlodas/) | Felület tapadási együtthatójának mérése gyorsulásmérővel | Önálló PWA |
| [Hanghullám-oszcilloszkóp](apps/oscilloscope/) | Tanuló PWA — csatlakozik a tanári Electron szerverhez | Szerver + PWA |
| [Sensor Logger Szerver](apps/sensor-logger-server/) | Fogadja a Sensor Logger app adatait, valós idejű grafikon | Electron szerver |

## Felépítés

```
fizikaikiserletek/
├── index.html              # Főoldal (GitHub Pages hub)
├── assets/                 # Közös CSS, JS, ikonok
├── apps/
│   ├── surlodas/           # Tapadási együttható mérő (önálló PWA)
│   ├── oscilloscope/       # Oszcilloszkóp tanuló PWA
│   └── oscilloscope-server/ # Tanári Electron szerver alkalmazás (Windows)
├── specs/                  # Nyílt specifikációk (AI-regenerálhatóság)
└── experiment-ideas/       # Kísérletötletek és architektúra kutatás
```

## Sensor Logger Szerver futtatása

1. Nyisd meg az `apps/sensor-logger-server/` mappát
2. `npm install`
3. `npm start`
4. Add meg a portot és kattints **▶ Indítás**
5. A megjelenő URL-t (`http://192.168.x.x:8080/data`) add meg a Sensor Logger appban

> Terjesztéshez: `npm run dist` → Windows telepítő `.exe`

## Hanghullám-oszcilloszkóp szerver futtatása

1. Nyisd meg az `apps/oscilloscope-server/` mappát
2. `npm install`
3. `npm start` — megnyílik az Electron ablak
4. Adj meg egy portot és jelszót, kattints **Szerver indítása**
5. Megjelenik a QR-kód — a tanulók beolvasva csatlakoznak

> Terjesztéshez: `npm run dist` → Windows telepítő `.exe`

## Új alkalmazás hozzáadása

Lásd `WEBSITE.md`.

## Specifikációk

A `specs/` mappa minden alkalmazáshoz tartalmaz egy nyílt specifikációt (Markdown),
amelyből az alkalmazás AI segítségével regenerálható.

# Specifikáció: Sensor Logger Szerver

## Célkitűzés
Windows Electron alkalmazás. Fogadja a Sensor Logger app HTTP Push adatait,
és valós időben jeleníti meg azokat egy scrolling time-series grafikonon.
Több eszközről egyszerre fogad adatot.

## Fájlszerkezet
```
apps/sensor-logger-server/
├── package.json
├── main.js           # Electron főfolyamat
├── preload.js        # contextBridge
├── server/
│   └── server.js     # Express HTTP szerver
└── renderer/
    └── index.html    # Teljes UI (topbar + sidebar + canvas grafikon)
```

## HTTP végpont
- `POST /data` — Sensor Logger ide küldi az adatokat (JSON, lásd pushing.md)
- `GET /data` — 200 OK visszajelzés a "Tap to Test" funkcióhoz
- Nincs TLS (HTTP), nincs authentikáció — lokális hálózaton fut

## JSON formátum (bejövő)
```json
{
  "messageId": 0,
  "sessionId": "...",
  "deviceId": "...",
  "payload": [
    { "name": "accelerometer", "time": 1698501144401773000, "values": { "x": 0.1, "y": -0.2, "z": 9.8 } },
    { "name": "gyroscope",     "time": 1698501144501773000, "values": { "x": 0.01, "y": 0.0, "z": -0.02 } }
  ]
}
```
- `time` UTC nanoszekundum
- Több olvasmány egy batchben (alapértelmezett batching: 1 másodperc)
- `messageId` növekvő, de üzenetek érkezhetnek sorrendtől eltérve

## Időkezelés
- X tengely: eltelt idő másodpercben (0.0 s = az eszköztől érkező első adat)
- `sessionStart[deviceId]` = első beérkező `time` nanoszekundumban
- `tMs = (timeNs - sessionStart) / 1_000_000`

## UI felépítés

### Topbar
- Szerverindítás: port beviteli mező + ▶ Indítás / ■ Stop gomb
- Szerver URL megjelenítése indítás után (pl. `http://192.168.1.5:8080/data`)
- Időablak (mp) beviteli mező (5–300 s, default 30 s)
- ⏸ Szünet / ▶ Folytatás gomb
- 🗑 Törlés gomb

### Sidebar (bal oldal, 240px)
- **Szenzorfa**: minden ismert szenzorhoz egy csoport, azon belül komponensek
  - Csoportfejléc: ▶ collapser, szenzornév, "összes" checkbox
  - Mezősor: checkbox, szín-pont, mezőnév
  - Checkbox állapot: `seriesMeta[key].enabled`
- **Eszközlista**: eszközazonosító (csonkítva), szín-pont, mért pontok száma

### Grafikon (Canvas 2D)
- `requestAnimationFrame` render loop
- Padding: top 30, right 20, bottom 40, left 70 (logical px × DPR)
- X tengely: tMinMs → tMaxMs (utolsó pont − időablak)
- Y tengely: auto-range a látható pontok alapján ± 8% padding
- Rács: 5 vízszintes vonal + tickCount függőleges vonal
- Y-tengely feliratok: `toPrecision(4)`
- X-tengely feliratok: másodperc (`.1f s`)
- Sorozatok: `ctx.strokeStyle = meta.color`, lineWidth 1.5 × DPR

## Adatkezelés (renderer-oldal)
- `seriesData: Map<key, [{tMs, value}]>` — max 10 000 pont/sorozat
- `seriesMeta: Map<key, {deviceId, sensor, field, color, enabled}>`
- `key = "${deviceId}::${sensor}::${field}"`
- Szünet alatt érkező adatok `pendingBuffer`-be kerülnek, folytatáskor merge-elve

## Szín paletta
- Eszközök: `DEVICE_COLORS` (8 szín)
- Mezők: `FIELD_COLORS` (12 szín, sorozatindex % 12)

## Függőségek
```json
{
  "express": "^4.18.2",
  "electron": "^28.0.0",
  "electron-builder": "^24.9.1"
}
```

## Build / futtatás
- Fejlesztés: `npm start` (`electron .`)
- Terjesztés: `npm run dist` → `.exe` (Windows NSIS)

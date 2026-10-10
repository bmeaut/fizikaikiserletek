# Specifikáció: Hanghullám-oszcilloszkóp — Tanári Electron Szerver

## Célkitűzés
Windows Electron alkalmazás. Elindítja a Node.js WebSocket + HTTPS szervert,
megjelenít egy QR-kódot a csatlakozáshoz, és tartalmazza a tanár vezérlőpultját
és a projektor nézetet.

## Fájlszerkezet
```
apps/oscilloscope-server/
├── package.json
├── main.js                  # Electron főfolyamat
├── preload.js               # Electron preload (contextBridge)
├── server/
│   ├── server.js            # Express + ws WebSocket szerver
│   ├── cert.js              # Self-signed tanúsítvány generálás (node-forge)
│   └── sessionStore.js      # Munkamenet adatok, gyűrűpuffer
├── renderer/
│   ├── launcher.html        # Indítóképernyő (port, jelszó beállítás, Indítás gomb)
│   ├── display.html         # Projektor nézet (oszcilloszkóp + spektrum)
│   ├── control.html         # Tanár vezérlőpult (jelszó, eszközlista, CSV)
│   └── js/
│       ├── display.js       # Vizualizáció (Chart.js vagy Canvas 2D API)
│       └── control.js       # Vezérlőpult logika
└── icons/
    └── icon.ico
```

## Electron főfolyamat (main.js)
- Egy `BrowserWindow`: indítóképernyő (`launcher.html`)
- A szerver indítása után: `launcher.html` → `display.html` (főablak, maximalizálva)
- Külön `BrowserWindow` a vezérlőpulthoz (`control.html`), külön ablakban
- IPC csatornák (ipcMain/ipcRenderer via contextBridge):
  - `server:start` → szerverindítás, visszaad: `{ port, ip, wsUrl, qrDataUrl }`
  - `server:stop`
  - `devices:list` → eszközlista
  - `device:toggle` → eszköz láthatóság ki/be
  - `device:rename` → átnevezés
  - `password:verify` → jelszó ellenőrzés
  - `password:change` → jelszó módosítás

## Szerver (server/server.js)
- **HTTPS**: `https.createServer` self-signed tanúsítvánnyal (node-forge generálja első indításkor, elmenti `%APPDATA%/oscilloscope-server/cert.pem` + `key.pem`)
- **Express** statikus fájlkiszolgálás: a `apps/oscilloscope/` mappa tartalmát szolgálja ki `/` alatt (így a tanulók a szerver URL-jén érik el a PWA-t)
- **WebSocket** (`ws` könyvtár), path: `/ws`
- **REST API** (Express):
  - `GET /api/devices` — csatlakozott eszközök
  - `POST /api/device/:id/visible` — láthatóság toggle
  - `POST /api/device/:id/rename` — átnevezés
  - `GET /api/session/export` — CSV letöltés
  - `POST /api/session/import` — CSV feltöltés
  - `POST /api/auth/verify` — jelszó ellenőrzés (bcrypt hash, `config.json`-ban tárolva)
  - `POST /api/auth/change` — jelszó módosítás

## WebSocket protokoll (szerver oldal)
Kliens → szerver üzenetek: lásd `specs/oscilloscope.md`

Szerver → display üzenetek:
```json
{
  "type": "frame",
  "devices": [
    {
      "deviceId": "<uuid>",
      "deviceName": "Ablak melletti pad",
      "visible": true,
      "color": "#e53935",
      "samples": [0.012, -0.034, ...],
      "fft": [0.0, 0.3, 1.2, ...]
    }
  ]
}
```
```json
{ "type": "devices-update", "devices": [...] }
```

## Munkamenet tároló (sessionStore.js)
- `Map<deviceId, { meta, ringBuffer }>` — gyűrűpuffer, max 10 másodperc @ 44100 Hz

## Indítóképernyő (launcher.html)
- Port mező (default: 3443)
- Jelszó mező (első indításkor kötelező beállítani)
- "Szerver indítása" gomb
- Állapot: "Szerver fut: https://192.168.x.x:3443"
- QR-kód megjelenítése (a szerver URL-je) — kattintásra teljes képernyős

## Projektor nézet (display.html)
- Fejléc: szerver IP + port, csatlakozott eszközök száma
- **Oszcilloszkóp panel**: Canvas 2D, minden látható eszköz waveform-ja külön színnel
- **Spektrum panel**: FFT vizualizáció (frekvencia tengely: 0–4000 Hz, amplitúdó dB-ben)
- Eszközlegenda: szín + név
- Frissítési ráta: ~30 fps (requestAnimationFrame)

## Vezérlőpult (control.html)
- Jelszó megadása → feloldás
- Eszközlista: névvel, láthatóság toggle, átnevezés, eltávolítás
- "CSV letöltése" gomb
- "CSV betöltése" gomb (fájlválasztó)
- "Jelszó módosítása" szekció

## Jelszó tárolás
- `%APPDATA%/oscilloscope-server/config.json`:
  ```json
  { "passwordHash": "<bcrypt hash>" }
  ```
- `bcryptjs` könyvtár (pure JS, nincs natív függőség)

## Eszközszínek
Előre definiált paletta (max 8 eszköz egyszerre jól látható):
`["#e53935","#1e88e5","#43a047","#fb8c00","#8e24aa","#00acc1","#f4511e","#6d4c41"]`

## Függőségek (package.json)
```json
{
  "dependencies": {
    "electron": "^28.0.0",
    "express": "^4.18.0",
    "ws": "^8.16.0",
    "node-forge": "^1.3.1",
    "bcryptjs": "^2.4.3",
    "qrcode": "^1.5.3"
  }
}
```

## Build / futtatás
- Fejlesztés: `npm start` (`electron .`)
- Terjesztés: `electron-builder` → `.exe` telepítő (Windows NSIS)
- Az Electron app tartalmazza a Node.js-t → a tanárnak nem kell semmit telepítenie

## Hálózati megjegyzések
- A self-signed tanúsítvány miatt a böngészőkben egyszer el kell fogadni a figyelmeztetést
- A tanulónak a szerver IP-jét kell elérnie (helyi WiFi hálózaton)
- iOS Safari: HTTPS kötelező mikrofon hozzáféréshez — a szerver HTTPS-t nyújt

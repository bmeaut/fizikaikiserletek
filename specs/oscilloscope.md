# Specifikáció: Hanghullám-oszcilloszkóp — Tanuló PWA

## Célkitűzés
Tanuló oldalon futó PWA. Mikrofont nyit, WebSocket-en keresztül küldi a hangadatokat
a tanár Electron szerveréhez. A vizualizáció a szerveren jelenik meg (projektoron).

## URL
`apps/oscilloscope/index.html` → GitHub Pages: `.../apps/oscilloscope/`

## Fájlszerkezet
```
apps/oscilloscope/
├── index.html
├── manifest.json
├── sw.js
└── icons/
    ├── icon-192.svg  (placeholder → PNG szükséges)
    └── icon-512.svg
```

## Képernyők / flow
1. **Csatlakozási képernyő**
   - QR-kód beolvasás gomb (kamerával olvassa be a tanár által megjelenített QR-t)
   - Manuális IP-cím bevitel szövegmező (`ws://192.168.x.x:3001`)
   - Eszköznév megadása (pl. "Asztal", "Ablak melletti pad") — opcionális, default: eszközazonosító
   - Csatlakozás gomb

2. **Csatlakozva képernyő**
   - Eszközállapot: csatlakozva / mikrofon aktív / szüneteltetve
   - Saját lokális oszcilloszkóp nézet (mini waveform — visszajelzés a tanulónak)
   - Szünet / Folytatás gomb
   - Lecsatlakozás gomb

3. **Szüneteltetve / tanár vezérli** állapot jelzése

## WebSocket protokoll (kliens → szerver)
Kapcsolódáskor küldött `hello` üzenet:
```json
{ "type": "hello", "deviceId": "<uuid>", "deviceName": "Ablak melletti pad" }
```

Hangadat csomag (~30/s):
```json
{
  "type": "audio",
  "deviceId": "<uuid>",
  "t": 1728555600123,
  "samples": [0.012, -0.034, ...],
  "sampleRate": 44100
}
```

Szerver → kliens vezérlőüzenetek:
```json
{ "type": "pause" }
{ "type": "resume" }
{ "type": "rename", "name": "Mikrofon 3" }
```

## Hangfeldolgozás
- API: `getUserMedia({ audio: true })` + `AudioContext`
- `ScriptProcessorNode` vagy `AudioWorkletNode` (bufferSize: 2048)
- Mintavételi frekvencia: eszköz alapértelmezése (általában 44100 Hz)
- Szerver felé küldött adat: `Float32Array` mintavételek JSON tömbként, ~30 csomag/s
- Lokális mini nézet: kis canvas, leegyszerűsített waveform (decimált, max 256 pont)

## QR beolvasás
- `getUserMedia` hátsó kamera
- `jsQR` könyvtár (CDN) a képkockák feldolgozásához
- A QR tartalmazza a WebSocket URL-t: `ws://192.168.x.x:3001`
- Sikeres olvasás után automatikusan kitölti az IP mezőt

## PWA
- `manifest.json`: `name: "Oszcilloszkóp"`, `short_name: "Oszcilloszkóp"`, `theme_color: "#1a237e"`
- `sw.js`: cache-first, `CACHE = 'oscilloscope-v1'`
- HTTPS nem szükséges a GitHub Pages oldalhoz, de a WebSocket kapcsolat `ws://` (nem `wss://`)
  lesz, mert a szerver lokális hálózaton fut — ez böngészőtől függően mixed-content figyelmeztetést
  adhat. Megoldás: a tanuló PWA-t is a Node.js szerver szolgálja ki (redirect a főoldalról),
  így mindkettő ugyanazon az originen van.

## iOS mikrofon
`getUserMedia` HTTPS-t igényel iOS-en. Mivel a szerver self-signed HTTPS-t használ,
a tanulónak egyszer el kell fogadnia a tanúsítványt.

# Specifikáció: Tapadási együttható mérő PWA

## Célkitűzés
Önálló (szerver nélküli) PWA. A telefont felületre helyezve és a felületet megdöntve,
csúszáskor automatikusan megméri a tapadási együtthatót (μ = tan θ).

## URL
`apps/surlodas/index.html` → GitHub Pages: `.../apps/surlodas/`

## Fájlszerkezet
```
apps/surlodas/
├── index.html
├── manifest.json
├── sw.js
└── icons/
    ├── icon-192.svg  (placeholder → PNG szükséges)
    └── icon-512.svg
```

## Fizika
- Szenzor: `DeviceMotionEvent.accelerationIncludingGravity` (ax, ay, az)
- Dőlésszög: `θ = arccos(|az| / |g|)` ahol `|g| = sqrt(ax²+ay²+az²)`
- Tapadási együttható: `μ = tan(θ)`
- Csúszásdetekció: jerk = `|a_t - a_{t-1}|`; ha jerk > küszöb → csúszás
- Küszöb: `JERK_BASE * (11 - érzékenység) / 5`; `JERK_BASE = 3.0 m/s²`
- Szimítás: exponenciális mozgóátlag (`α = 0.15`)

## Képernyők / állapotok
1. **Engedélykérő képernyő** (`#perm-screen`): iOS esetén `DeviceMotionEvent.requestPermission()` szükséges; Androidon automatikus
2. **Mérési képernyő** (`#live-section`):
   - Élő dőlésszög szám + sávgrafikon (0–60°)
   - Aktuális μ érték
   - Állapotpill: Várakozás / Mérés folyamatban / Csúszás észlelve
   - ▶ Mérés indítása / ■ Stop gomb
3. **Csúszás eredmény panel** (`#slip-result`): szög + μ, Mentés / Elvetés gomb
4. **Előzmények** (`#history-section`): fordított időrendben, törlés soronként, összes törlése

## Adattárolás
`localStorage`, kulcs: `surlodas_history`, formátum:
```json
[{ "id": 1234567890, "ts": "2026. 10. 10. 14:23", "angle": 21.3, "mu": 0.391 }]
```

## PWA
- `manifest.json`: `name: "Tapadási együttható mérő"`, `short_name: "Tapadás"`, `theme_color: "#1a237e"`
- `sw.js`: cache-first, `CACHE = 'surlodas-v1'` (verziószám növelendő frissítéskor)
- Visszajelzés csúszáskor: `navigator.vibrate([100, 50, 100])`

## iOS specifikus
`DeviceMotionEvent.requestPermission` csak HTTPS-en és felhasználói gesztusra hívható.
Androidon és desktopon ez a metódus nem létezik → automatikus indítás.

## Érzékenység
Csúszóval (1–10) állítható a jerk küszöb. Alacsony → kevesebb téves riasztás; magas → korábbi detektálás.

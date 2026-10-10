# Fizikai Kísérletek Mobil PWA Mini-Applikációként

Kutatási összefoglaló fizika órákhoz és bemutató eseményekhez, mobil eszközök szenzorainak
felhasználásával — az adatok szerverre streamelve, projektoron megjelenítve.

---

## Elérhető Mobil Szenzorok és Fizikai Alkalmazásaik

| Szenzor | API | Fizikai terület |
|---------|-----|-----------------|
| Gyorsulásmérő | `DeviceMotionEvent` | Newton-törvények, kinematika, erők |
| Giroszkóp | `DeviceOrientationEvent` | Forgásmechanika, impulzusnyomaték |
| Magnetométer | `DeviceOrientationEvent` (abszolút) | Mágnesség, Föld mágneses tere |
| Mikrofon | Web Audio API | Akusztika, hullámok, Fourier-analízis |
| Kamera | `getUserMedia` | Optika, szín, fényintenzitás |
| GPS | Geolocation API | Kinematika (sebesség/távolság), Doppler |
| Barométer | (korlátozott böngészőtámogatás) | Nyomás, magasság |
| Fényszenzor | (korlátozott — kamera luma alapján) | Fotometria |
| Közelségszenzor | (korlátozott böngészőtámogatás) | Rövid hatótávolságú érzékelés |

**Böngészőtámogatási megjegyzés:** A gyorsulásmérő, giroszkóp és mikrofon rendelkezik a
legszélesebb platformközi támogatással. iOS 13+ esetén a `DeviceMotion` felhasználói
engedélyt igényel. A GPS univerzális, de lassú (~1 Hz).

---

## Kísérletötletek

### 1. Ingaóra / Szabadesés-detektor
**Szenzor:** Gyorsulásmérő  
**Koncepció:** A gravitációs gyorsulás mérése (g ≈ 9,81 m/s²). A tanulók tartják vagy ejtik
a telefont, az app érzékeli a szabadesési ablakot (közel nulla gyorsulás), majd az ütközés
csúcsát. Alternatívaként a telefont ingaként lóbálva mérhető a periódusidő és ebből levezethető g.  
**Projektoron:** Élő gyorsulásmérő görbe + számított g-érték az elméleti értékkel összehasonlítva.  
**Több eszköz:** Minden tanuló egyszerre ejti; a kijelző a mért g-értékek hisztogramját mutatja.

---

### 2. Hanghullám-oszcilloszkóp és Frekvenciaelemző
**Szenzor:** Mikrofon  
**Koncepció:** Bármely hang (hang, hangvilla, hangszer, taps) valós idejű hullámformája és
FFT-spektruma. Bemutatja a hullámtulajdonságokat: frekvencia, amplitúdó, felhangok, szuperpozíció.  
**Projektoron:** Élő oszcilloszkóp + spektrumelemző (mint egy valódi fizikai műszer).  
**Több eszköz:** Minden tanuló telefonja „mikrofon-csomóponttá" válik — frekvenciagrafikonok
összehasonlítása egymás mellett. Lebegési frekvencia bemutatása: két telefon kissé eltérő hangot játszik.

---

### 3. Hangsebesség Mérése
**Szenzor:** Mikrofon (2 eszköz)  
**Koncepció:** Az A telefon kattanást ad ki; a B telefon rögzíti, mikor érzékeli a hangot.
Időkülönbség × távolság = hangsebesség. Klasszikus hullámkísérlet digitálisan.  
**Projektoron:** Mindkét eszköz hullámformája érkezési idő jelölőkkel, számított sebesség.  
**Megjegyzés:** Szinkronizált órákat vagy szerverkoordinált triggert igényel.

---

### 4. Szeizmográf / Rezgéstérkép
**Szenzor:** Gyorsulásmérő  
**Koncepció:** Telefonok elhelyezése különböző felületeken (asztal, padló, fal), miközben
valaki dobbant vagy egy hangszóró basszust játszik. Az eszközök szeizmográf-hálózatként
működnek — bemutatja a hullámterjedést szilárd anyagokban.  
**Projektoron:** Több csatornás szeizmográf, minden „állomás" érkezési idősorával.  
**Több eszköz:** Osztályos részvétel — mindenki telefonja szeizmikus szenzorcsomóponttá válik.

---

### 5. Forgómozgás és Szögsebességek
**Szenzor:** Giroszkóp  
**Koncepció:** Telefon forgatása (széken, kézzel) a szögsebesség mérésére (rad/s). Bemutatja
az impulzusnyomaték megmaradását — karok be/kivételével forgatás közben.  
**Projektoron:** Élő szögsebességgörbe, felhalmozott forgásszög.  
**Bevonás:** A tanulók telefonnal forognak a székükön — ki tud egyenletes fordulatszámot tartani?

---

### 6. Centripetális Gyorsulás
**Szenzor:** Gyorsulásmérő  
**Koncepció:** Telefon zsinórra kötése és körkörös mozgatása. Sugárirányú gyorsulás = ω²r.
A tanulók ellenőrizhetik a képletet a sugár és sebesség változtatásával.  
**Projektoron:** Élő centripetális vs. tangenciális gyorsuláskomponensek, számított ω.

---

### 7. Mágneses Tér Térképező
**Szenzor:** Magnetométer  
**Koncepció:** Telefon mozgatása mágnesek, hangszórótekercsek vagy elektronika körül a
térerősség és irány feltérképezéséhez. A Föld mágneses terének változása tájolás szerint.  
**Projektoron:** A térerősség 2D hőtérképe a telefon mozgása közben (ha GPS vagy rács alapú
pozicionálás elérhető), vagy élő vektornyíl a térerő irányával.  
**Több eszköz:** Több tanuló térképezi az osztályterem különböző zónáit — közösen megalkotott
mágnestér-térkép.

---

### 8. Doppler-effektus Bemutató
**Szenzor:** Mikrofon + GPS vagy manuális pozíció  
**Koncepció:** A tanuló közeledik/távolodik egy állandó hangot adó hangszórótól. A mikrofon
érzékeli a frekvenciaeltolódást. Alternatívaként a GPS sebesség korrelál az észlelt
hangmagasság-változással.  
**Projektoron:** Élő frekvenciaspektrum, valós időben mutatva a Doppler-eltolódást.

---

### 9. Reakcióidő Kísérlet
**Szenzor:** Érintőképernyő (koppintás időzítése)  
**Koncepció:** Fény villan a projektoron; a tanulók a lehető leggyorsabban koppintanak
telefonjukra. A szerver rögzíti az időbélyegeket, kiszámolja az osztály reakcióidő-eloszlását.  
**Projektoron:** Élő reakcióidő-hisztogram, személyes rekordok, statisztikák.  
**Több eszköz:** Tökéletes csoportos kísérlet — 30 tanuló vesz részt egyszerre.

---

### 10. Hangszintmérő / Zajszennyezés
**Szenzor:** Mikrofon  
**Koncepció:** Decibelszint mérése; logaritmikus skálák, halláskárosodási küszöbök,
zajszennyezés megvitatása. A tanulók mérik a környezetüket csendes/hangos referenciaértékekkel.  
**Projektoron:** Élő dB-sávgrafikon eszközönként, színkódolással (zöld/sárga/piros zónák).  
**Több eszköz:** Az osztályterem térbeli zajtérképe.

---

### 11. Gravitációs Összehasonlítás (Lift / Ugrás)
**Szenzor:** Gyorsulásmérő  
**Koncepció:** A látszólagos súly változásának mérése liftben fel/le haladva, vagy ugráskor.
Szabadesés (ugrás) közben g_látszólagos → 0. Landoláskor a csúcs mutatja az ütközési erőt.  
**Projektoron:** Látszólagos g idősordiagramja, ugrás/landolás eseményekkel jelölve.

---

### 12. Hulláminterferencia / Állóhullámok (Együttműködő)
**Szenzor:** Mikrofon + Hangszóró  
**Koncepció:** Két eszköz szinuszhullámokat játszik; egy harmadik eszköz mikrofonja érzékeli
az interferenciamintát, ahogy mozog köztük. Konstruktív és destruktív interferencia.  
**Projektoron:** Mért amplitúdó pozíció szerint, az elméleti mintával egybevetve.

---

### 13. Fényintenzitás Mérése (Kamera Luma)
**Szenzor:** Kamera (luminancia a videoképkockából)  
**Koncepció:** A fényintenzitás csökkenésének mérése távolsággal (fordított négyzetszabály).
A tanulók különböző távolságokból tartják a telefont egy fényforrás felé.  
**Projektoron:** Intenzitás vs. távolság grafikon 1/r² illesztési görbével.

---

### 14. Iránytű és a Föld Mágneses Tere
**Szenzor:** Magnetométer  
**Koncepció:** A Föld mágneses terének feltérképezése, deklináció szögének mérése, beltéri
vs. kültéri leolvasások összehasonlítása. Megbeszélés: miért működnek az iránytűk és mi zavarhatja.  
**Projektoron:** Animált iránytűtű, térerősség értéke, eltérés az igaz északtól.

---

### 15. Statisztikus Mechanika — Pénzfeldobás / Véletlen Séta
**Szenzor:** Gyorsulásmérő (rázásérzékelés) vagy Érintőképernyő  
**Koncepció:** Telefon megrázása véletlenszerű „pénzfeldobás" generálásához (a gyorsulásmérő
zajával mint entrópiaforrással). 30 tanulóval élőben épül fel a binomiális eloszlás.  
**Projektoron:** Növekvő hisztogram, amely közelít a normáleloszláshoz — feltörekvő statisztika!  
**Több eszköz:** Több tanuló = jobb statisztika. Remek a valószínűségszámítás tanításához.

---

## Architekturális Javaslat

### Áttekintés

```
[Mobil Eszközök] ──WebSocket──▶ [Node.js Szerver] ──WebSocket──▶ [Projektor Megjelenítő Böngésző]
   (szenzorok)                    (aggregálás,                      (csak megjelenítés,
                                   szoba kódok,                      csak olvasható kliens)
                                   időbélyegek)
```

### Főbb Tervezési Döntések

**WebSocket HTTP-lekérdezés helyett:**  
Alacsony késleltetésű kétirányú csatorna. A szenzorAdatok (különösen a gyorsulásmérő
50-100 Hz-en) elárasztanák a HTTP-lekérdezést. A WebSocket állandó kapcsolatot tart fenn,
a szerver azonnal küldhet a kijelzőre.

**Szoba Kód Rendszer (mint a Kahoot/Mentimeter):**  
- A tanár megnyitja a projektor-megjelenítőt → a szerver 4–6 karakteres szobakódot generál
- A tanulók navigálnak a `sajatapp.com`-ra, beírják a szobakódot
- Nincs fiók, nincs letöltés — tiszta PWA
- QR-kód a projektoron azonnali csatlakozást tesz lehetővé

**Kísérletválasztó a Projektoron:**  
- A tanár megjelenítőjén vezérlőpanel van az aktív kísérlet kiválasztásához
- Elküldi a kísérlet típusát az összes csatlakoztatott telefonra
- A telefonok ennek megfelelően váltanak szenzorrögzítési módra

**Szerver Feladatai:**
- Szobakezelés (létrehozás/csatlakozás/kilépés)
- Szenzoradata-befogadás (érvényesítés, időbélyegzés, gyűrűpufferben tárolás)
- Aggregálás (pl. átlagos g az összes eszközön)
- Szétküldés a megjelenítő kliensnek WebSocketen keresztül
- Opcionálisan: munkamenet-rögzítés óra utáni elemzéshez

**Javasolt Technológiai Verem:**
- **Szerver:** Node.js + [Socket.io](https://socket.io/) vagy natív WebSocket (ws könyvtár)  
  Alternatíva: Bun a jobb nyers teljesítményért
- **Megjelenítő kliens:** Vanilla JS vagy Svelte + D3.js vagy Chart.js a vizualizációhoz
- **Mobil kliens:** PWA Service Workerrel az offline képességért és telepíthetőségért
- **Hosting:** Bármely VPS vagy akár Raspberry Pi az iskolai hálózaton csak helyi használathoz

**Késleltetési keret:**  
Gyorsulásmérő → szerver → megjelenítő legyen < 100ms a sima valós idejű grafikonokhoz.  
WebSocketekkel helyi hálózaton ~5-20ms oda-vissza időre lehet számítani.

### Több Eszközös Kísérlet Architektúra

Csoportos kísérletekhez (pl. szeizmográf-hálózat, reakcióidő-hisztogram):

```
1. eszköz ──▶ ┐
2. eszköz ──▶ │──▶ Szerver (aggregál) ──▶ Megjelenítő
N. eszköz ──▶ ┘
```

A szerver fenntart egy `Map<szobáId, Map<eszközId, legutolsóLeolvasás>>` struktúrát és
kiszámolja az aggregátumokat (hisztogramok, átlagok, min/max) mielőtt elküldi a megjelenítőnek.
A megjelenítő ~10-30 fps-sel frissül függetlenül a csatlakoztatott eszközök számától.

### PWA Megfontolások

- A Service Worker gyorsítótárazza az app-keretrendszert, így betöltődik még ha a terem WiFi-je lassú is
- A Web App Manifest lehetővé teszi a „Hozzáadás a kezdőképernyőhöz" funkciót ismétlődő osztályokhoz
- A szenzor-engedélykérések (különösen iOS esetén) egyértelmű felhasználói interakcióval kell kiváltani
- HTTPS szükséges a DeviceMotion-höz iOS 13+-on — Let's Encrypt használata ajánlott

---

## Leginkább Látványos Projektoron

Közönségbevonási potenciál szerint rangsorolva:

1. **Hang-oszcilloszkóp** — azonnal vizuális, a tanulók énekelnek/beszélnek és látják hangjukat
2. **Szeizmográf-hálózat** — mindenki részt vesz, a hullámfrontok láthatók az eszközök között
3. **Reakcióidő-hisztogram** — versengő, élő eloszlást épít fel
4. **Forgásdinamika** — forgó telefon, az élő szögsebesség intuitív
5. **Mágnestér-térképező** — furcsa érzés látni a láthatatlan tereket láthatóvá válni

---

## Hasonló Meglévő Projektek

- **phyphox** (RWTH Aachen) — a telefonos fizikai kísérletek arany standardja.
  Nyílt forráskódú, támogatja a távelérést. Érdemes tanulmányozni kísérletötletekhez.
- **Vernier Graphical Analysis** — kereskedelmi, dedikált szenzorokhoz, de megmutatja
  hogyan néz ki a professzionális fizikai adatnaplózás.
- **Sparkvue** — hasonló kereskedelmi eszköz.
- **iSense** — böngészőalapú szenzornaplózás.

**A projekt legfontosabb megkülönböztető jegye:** Szerveroldali aggregálás + projektor-megjelenítő +
PWA (telepítés nélkül) + több eszközös csoportos részvétel. A phyphox támogatja a táoli megjelenítést,
de a csoportos részvétel szöge új és egyedi.

---

## Következő Lépések / Megvalósítási Ötletek

1. Kezdés a **Hang-oszcilloszkóppal** — a mikrofon API a legegyszerűbb, vizuálisan lenyűgöző
2. **Gyorsulásmérő szabadesés** hozzáadása második kísérletként
3. Először a **szobakód + WebSocket infrastruktúra** megépítése, majd a kísérletek beillesztése
4. **Reakcióidő** hozzáadása az első valódi több eszközös csoportos kísérletként
5. A **phyphox távoli szerver protokoll** vizsgálata a lehetséges kompatibilitás érdekében

---

*Kutatás elvégezve: 2026-10-10*

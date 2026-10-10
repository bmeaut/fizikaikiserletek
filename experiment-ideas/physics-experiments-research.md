# Physics Experiments as Mobile PWA Mini-Apps

Research summary for physics class / road show demonstrations using mobile device sensors,
streamed to a server and displayed on a projector.

---

## Available Mobile Sensors & Their Physics

| Sensor | API | Physics Domain |
|--------|-----|----------------|
| Accelerometer | `DeviceMotionEvent` | Newton's laws, kinematics, forces |
| Gyroscope | `DeviceOrientationEvent` | Rotational dynamics, angular momentum |
| Magnetometer | `DeviceOrientationEvent` (absolute) | Magnetism, Earth's field |
| Microphone | Web Audio API | Acoustics, waves, Fourier analysis |
| Camera | `getUserMedia` | Optics, color, light intensity |
| GPS | Geolocation API | Kinematics (speed/distance), Doppler |
| Barometer | (limited browser support) | Pressure, altitude |
| Light sensor | (limited — via camera luma) | Photometry |
| Proximity | (limited browser support) | Short-range detection |

**Browser support note:** Accelerometer, gyroscope, and microphone have the widest cross-platform
support. On iOS 13+, `DeviceMotion` requires user permission. GPS is universal but slow (~1 Hz).

---

## Experiment Ideas

### 1. Pendulum Timer / Free-Fall Detector
**Sensor:** Accelerometer  
**Concept:** Measure gravitational acceleration (g ≈ 9.81 m/s²). Students hold or drop the phone
and the app detects the free-fall window (near-zero acceleration), then the impact spike.
Alternatively, swing the phone as a pendulum to measure period and derive g.  
**Projector display:** Live accelerometer trace + calculated g value vs. textbook value.  
**Multi-device:** All students drop simultaneously; display shows histogram of measured g values.

---

### 2. Sound Wave Oscilloscope & Frequency Analyzer
**Sensor:** Microphone  
**Concept:** Real-time waveform and FFT spectrum of any sound (voice, tuning fork, instrument,
clapping). Demonstrates wave properties: frequency, amplitude, harmonics, superposition.  
**Projector display:** Live oscilloscope + spectrum analyzer (like a real physics instrument).  
**Multi-device:** Each student's phone becomes a "microphone node" — compare frequency plots
side by side. Beat frequency demonstration: two phones playing slightly different tones.

---

### 3. Speed of Sound Measurement
**Sensor:** Microphone (2 devices)  
**Concept:** Phone A emits a click; Phone B records when it detects the sound. Time difference × 
distance = speed of sound. Classic wave experiment made digital.  
**Projector display:** Waveform of both devices with time-of-arrival markers, calculated speed.  
**Note:** Requires synchronized clocks or a server-coordinated trigger.

---

### 4. Seismograph / Vibration Map
**Sensor:** Accelerometer  
**Concept:** Place phones on different surfaces (table, floor, wall) while someone stomps or a
speaker plays bass. Devices act as a seismograph network — shows wave propagation through solids.  
**Projector display:** Multi-trace seismograph, timeline of arrival at each "station."  
**Multi-device:** Class participation — everyone's phone becomes a seismic sensor node.

---

### 5. Rotational Motion & Angular Velocity
**Sensor:** Gyroscope  
**Concept:** Spin a phone (on a chair, by hand) to measure angular velocity (rad/s). Demonstrates
conservation of angular momentum — hold arms in/out while spinning.  
**Projector display:** Live angular velocity plot, accumulated rotation angle.  
**Engagement:** Students spin in their chair with phone — who can maintain a constant spin rate?

---

### 6. Centripetal Acceleration
**Sensor:** Accelerometer  
**Concept:** Attach phone to a string and swing it in a circle. Radial acceleration = ω²r.
Students can verify the formula by varying radius and speed.  
**Projector display:** Live centripetal vs. tangential acceleration components, calculated ω.

---

### 7. Magnetic Field Mapper
**Sensor:** Magnetometer  
**Concept:** Walk the phone around magnets, speaker coils, or electronics to map field strength
and direction. Earth's field variation by orientation.  
**Projector display:** 2D heat map of field strength as phone moves (if GPS or a grid is used),
or live vector arrow showing field direction.  
**Multi-device:** Multiple students map different zones of a classroom — crowd-source a field map.

---

### 8. Doppler Effect Demonstrator
**Sensor:** Microphone + GPS or manual position  
**Concept:** Student moves toward/away from a speaker emitting a fixed tone. Microphone detects
the frequency shift. Alternatively, GPS speed correlates with perceived pitch shift.  
**Projector display:** Live frequency spectrum showing the Doppler shift in real time.

---

### 9. Reaction Time Experiment
**Sensor:** Touchscreen (tap event timing)  
**Concept:** A light flashes on the projector screen; students tap their phones as fast as
possible. Server logs timestamps, calculates reaction time distribution for the class.  
**Projector display:** Live histogram of reaction times, personal records, statistics.  
**Multi-device:** Perfect crowd experiment — 30 students participate simultaneously.

---

### 10. Sound Level Meter / Noise Pollution
**Sensor:** Microphone  
**Concept:** Measure decibel levels; discuss logarithmic scales, hearing damage thresholds,
noise pollution. Students measure their environment vs. quiet/loud references.  
**Projector display:** Live dB bar graph per device, color-coded (green/yellow/red zones).  
**Multi-device:** Spatial noise map of the classroom.

---

### 11. Gravity Comparison (Elevator / Jumping)
**Sensor:** Accelerometer  
**Concept:** Measure apparent weight change when going up/down in an elevator, or jumping.
During free-fall (jump), g_apparent → 0. On landing, spike shows impact force.  
**Projector display:** Timeline of apparent g, annotated with jump/land events.

---

### 12. Wave Interference / Standing Waves (Collaborative)
**Sensor:** Microphone + Speaker  
**Concept:** Two devices play sine waves; a third device's microphone detects the interference
pattern as it moves between them. Constructive vs. destructive interference.  
**Projector display:** Detected amplitude vs. position, overlaid with the theoretical pattern.

---

### 13. Light Intensity Measurement (Camera Luma)
**Sensor:** Camera (luminance from video frame)  
**Concept:** Measure how light intensity drops with distance (inverse-square law). Students
hold phone at different distances from a light source.  
**Projector display:** Intensity vs. distance plot with 1/r² fit overlay.

---

### 14. Compass & Earth's Magnetic Field
**Sensor:** Magnetometer  
**Concept:** Map the Earth's magnetic field, measure declination angle, compare indoor vs.
outdoor readings. Discuss why compasses work and what can interfere.  
**Projector display:** Animated compass needle, field strength value, deviation from true north.

---

### 15. Statistical Mechanics — Coin Flip / Random Walk
**Sensor:** Accelerometer (shake detection) or Touchscreen  
**Concept:** Shake the phone to generate a "random" coin flip (using accelerometer noise as
entropy). With 30 students, build the binomial distribution live.  
**Projector display:** Growing histogram approaching the normal distribution — emergent statistics!  
**Multi-device:** More students = better statistics. Great for teaching probability.

---

## Architecture Recommendation

### Overview

```
[Mobile Devices] ──WebSocket──▶ [Node.js Server] ──WebSocket──▶ [Projector Display Browser]
   (sensors)                      (aggregates,                     (visualization only,
                                   room codes,                      read-only client)
                                   timestamps)
```

### Key Design Decisions

**WebSockets over HTTP polling:**  
Low-latency bidirectional channel. Sensor data (esp. accelerometer at 50-100 Hz) would overwhelm
HTTP polling. WebSocket keeps a persistent connection, server can push to display instantly.

**Room Code System (like Kahoot/Mentimeter):**  
- Teacher opens projector display → server generates a 4–6 character room code
- Students navigate to `yourapp.com`, enter the room code
- No account, no download — pure PWA
- QR code on projector makes joining instant

**Experiment Selector on Projector:**  
- Teacher's display has a control panel to select which experiment is active
- Sends the experiment type to all connected phones
- Phones switch their sensor recording mode accordingly

**Server Responsibilities:**
- Room management (create/join/leave)
- Sensor data ingestion (validate, timestamp, store in ring buffer)
- Aggregation (e.g., average g across all devices)
- Fan-out to display client via WebSocket
- Optionally: session recording for post-class analysis

**Suggested Stack:**
- **Server:** Node.js + [Socket.io](https://socket.io/) or native WebSocket (ws library)  
  Alternative: Bun for better raw performance
- **Display client:** Vanilla JS or Svelte + D3.js or Chart.js for visualization
- **Mobile client:** PWA with Service Worker for offline capability and installability
- **Hosting:** Any VPS or even a Raspberry Pi on the school network for local-only use

**Latency budget:**  
Accelerometer → server → display should be < 100ms for smooth real-time charts.  
With WebSockets on a local network, expect ~5-20ms round trip.

### Multi-Device Experiment Architecture

For crowd experiments (e.g., seismograph network, reaction time histogram):

```
Device 1 ──▶ ┐
Device 2 ──▶ │──▶ Server (aggregates) ──▶ Display
Device N ──▶ ┘
```

Server maintains a `Map<roomId, Map<deviceId, latestReading>>` and computes
aggregates (histograms, averages, min/max) before sending to display.
Display updates at ~10-30 fps regardless of how many devices are connected.

### PWA Considerations

- Service Worker caches the app shell so it loads even if the room's WiFi is slow
- Web App Manifest allows "Add to Home Screen" for repeat classes
- Sensor permission prompts (iOS especially) should be triggered by a clear user gesture
- HTTPS is required for DeviceMotion on iOS 13+ — use Let's Encrypt

---

## Most Visually Impressive for a Projector

Ranked by audience engagement potential:

1. **Sound Oscilloscope** — instantly visual, students can sing/speak and see their voice
2. **Seismograph Network** — everyone participates, wave fronts visible across devices
3. **Reaction Time Histogram** — competitive, builds a live distribution
4. **Rotational Dynamics** — spinning phone, live angular velocity is intuitive
5. **Magnetic Field Mapper** — eerie to see invisible fields made visible

---

## Similar Existing Projects

- **phyphox** (RWTH Aachen) — the gold standard for phone-based physics experiments.
  Open-source, supports remote access. Worth studying for experiment ideas.
- **Vernier Graphical Analysis** — commercial, for dedicated sensors, but shows what
  professional physics data logging looks like.
- **Sparkvue** — similar commercial tool.
- **iSense** — browser-based sensor logging.

**Key differentiator of this project:** Server-side aggregation + projector display + PWA
(no install) + multi-device crowd participation. phyphox supports remote display but
the crowd-participation angle is novel.

---

## Next Steps / Ideas for Implementation

1. Start with the **Sound Oscilloscope** — microphone API is simplest, visually impressive
2. Add **Accelerometer Free-fall** as second experiment
3. Build the **room code + WebSocket infrastructure** first, then plug in experiments
4. Add **Reaction Time** as first true multi-device crowd experiment
5. Explore **phyphox remote server protocol** for potential compatibility

---

*Research conducted: 2026-10-10*

// Device map: deviceId → { meta, ringBuffer, ws, visible, color }
const COLORS = ['#e53935','#1e88e5','#43a047','#fb8c00','#8e24aa','#00acc1','#f4511e','#6d4c41'];
const MAX_RING = 44100 * 10; // 10 seconds at 44100 Hz
const MAX_CSV_ROWS = 44100 * 60; // 60 seconds max for CSV

const devices = new Map();
// Full recording: { deviceId, deviceName, entries: [{t, samples}] }
const recording = new Map();
let colorIdx = 0;

function registerDevice(deviceId, deviceName, ws) {
  const color = COLORS[colorIdx % COLORS.length];
  colorIdx++;
  devices.set(deviceId, {
    deviceId, deviceName, ws,
    visible: true, color,
    ring: [],       // Array of Float32 samples (ring buffer, newest appended)
    sampleRate: 44100,
  });
  recording.set(deviceId, { deviceId, deviceName, entries: [] });
}

function removeDevice(deviceId) {
  const d = devices.get(deviceId);
  if (d) { colorIdx--; if (colorIdx < 0) colorIdx = 0; }
  devices.delete(deviceId);
}

function addSamples(deviceId, t, samples, sampleRate) {
  const d = devices.get(deviceId);
  if (!d) return;
  d.sampleRate = sampleRate;
  d.ring.push(...samples);
  if (d.ring.length > MAX_RING) d.ring.splice(0, d.ring.length - MAX_RING);

  const rec = recording.get(deviceId);
  if (rec) rec.entries.push({ t, samples });
}

function getDevices() {
  return [...devices.values()].map(({ deviceId, deviceName, visible, color }) =>
    ({ deviceId, deviceName, visible, color })
  );
}

function toggleDevice(deviceId) {
  const d = devices.get(deviceId);
  if (d) d.visible = !d.visible;
  return getDevices();
}

function renameDevice(deviceId, name) {
  const d = devices.get(deviceId);
  if (d) {
    d.deviceName = name;
    const rec = recording.get(deviceId);
    if (rec) rec.deviceName = name;
    // Notify client via WS if connected
    if (d.ws && d.ws.readyState === 1) {
      d.ws.send(JSON.stringify({ type: 'rename', name }));
    }
  }
  return getDevices();
}

function buildFrame() {
  const frameDevices = [];
  for (const d of devices.values()) {
    if (!d.visible) continue;
    // Last 2048 samples for waveform display
    const tail = d.ring.slice(-2048);
    // Simple FFT magnitude via DFT (512 point)
    const fft = simpleMagnitude(tail, 512);
    frameDevices.push({
      deviceId: d.deviceId,
      deviceName: d.deviceName,
      color: d.color,
      samples: tail,
      fft,
    });
  }
  return { type: 'frame', devices: frameDevices };
}

// Simple DFT magnitude for N points (server-side, called ~30/s per device)
function simpleMagnitude(samples, N) {
  const n = Math.min(samples.length, N);
  const mag = new Array(N / 2).fill(0);
  for (let k = 0; k < N / 2; k++) {
    let re = 0, im = 0;
    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * k * t) / N;
      re += samples[t] * Math.cos(angle);
      im -= samples[t] * Math.sin(angle);
    }
    mag[k] = Math.sqrt(re * re + im * im) / n;
  }
  return mag;
}

function exportCsv() {
  const lines = ['timestamp_ms,device_id,device_name,sample_index,value'];
  for (const [, rec] of recording) {
    let idx = 0;
    for (const entry of rec.entries) {
      for (const v of entry.samples) {
        lines.push(`${entry.t},${rec.deviceId},${JSON.stringify(rec.deviceName)},${idx},${v.toFixed(6)}`);
        idx++;
        if (lines.length > MAX_CSV_ROWS) break;
      }
      if (lines.length > MAX_CSV_ROWS) break;
    }
  }
  return lines.join('\n');
}

function importCsv(csv) {
  // Parse and replay: build virtual devices from CSV, push frames to display
  const lines = csv.split('\n').slice(1).filter(Boolean);
  const byDevice = new Map();
  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length < 5) continue;
    const [t, deviceId, , , value] = parts;
    const deviceName = parts[2].replace(/^"|"$/g, '');
    if (!byDevice.has(deviceId)) {
      byDevice.set(deviceId, { deviceId, deviceName, samples: [], color: COLORS[byDevice.size % COLORS.length] });
    }
    byDevice.get(deviceId).samples.push(parseFloat(value));
  }
  // Push as a single frame
  const frameDevices = [];
  for (const d of byDevice.values()) {
    const tail = d.samples.slice(-2048);
    frameDevices.push({ ...d, samples: tail, fft: simpleMagnitude(tail, 512) });
  }
  if (global.onDisplayFrame) global.onDisplayFrame({ type: 'frame', devices: frameDevices });
}

function clear() {
  devices.clear();
  recording.clear();
  colorIdx = 0;
}

module.exports = { registerDevice, removeDevice, addSamples, getDevices, toggleDevice, renameDevice, buildFrame, exportCsv, importCsv, clear };

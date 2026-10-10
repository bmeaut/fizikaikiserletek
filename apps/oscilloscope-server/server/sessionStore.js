// Device map: deviceId → { meta, ringBuffer, ws, visible, color }
const COLORS = ['#e53935','#1e88e5','#43a047','#fb8c00','#8e24aa','#00acc1','#f4511e','#6d4c41'];
const MAX_RING = 44100 * 10; // 10 seconds at 44100 Hz

const devices = new Map();
let colorIdx = 0;

function registerDevice(deviceId, deviceName, ws) {
  const color = COLORS[colorIdx % COLORS.length];
  colorIdx++;
  devices.set(deviceId, {
    deviceId, deviceName, ws,
    visible: true, color,
    ring: [],
    sampleRate: 44100,
  });
}

function removeDevice(deviceId) {
  devices.delete(deviceId);
  colorIdx = Math.max(0, colorIdx - 1);
}

function addSamples(deviceId, t, samples, sampleRate) {
  const d = devices.get(deviceId);
  if (!d) return;
  d.sampleRate = sampleRate;
  d.ring.push(...samples);
  if (d.ring.length > MAX_RING) d.ring.splice(0, d.ring.length - MAX_RING);
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
    const tail = d.ring.slice(-2048);
    const fft = simpleMagnitude(tail, 512);
    frameDevices.push({
      deviceId: d.deviceId,
      deviceName: d.deviceName,
      color: d.color,
      samples: tail,
      sampleRate: d.sampleRate,
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

function clear() {
  devices.clear();
  colorIdx = 0;
}

module.exports = { registerDevice, removeDevice, addSamples, getDevices, toggleDevice, renameDevice, buildFrame, clear };

// ── Display renderer: oscilloscope + FFT visualization ────────────────────
const waveCanvas = document.getElementById('wave-canvas');
const fftCanvas  = document.getElementById('fft-canvas');
const waveCtx    = waveCanvas.getContext('2d');
const fftCtx     = fftCanvas.getContext('2d');
const legend     = document.getElementById('legend');
const noDevices  = document.getElementById('no-devices');
const qrBtn      = document.getElementById('qr-btn');
const lightbox   = document.getElementById('qr-lightbox');
const qrImg      = document.getElementById('qr-img');
const qrUrl      = document.getElementById('qr-url');
const qrAppUrl   = document.getElementById('qr-app-url');
const qrClose    = document.getElementById('qr-close');
const devCount   = document.getElementById('device-count');

let latestFrame = null;

// ── Resize canvases to physical pixels ────────────────────────────────────
function resizeCanvas(canvas) {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width  = Math.round(rect.width  * devicePixelRatio);
  canvas.height = Math.round(rect.height * devicePixelRatio);
}
function resizeAll() { resizeCanvas(waveCanvas); resizeCanvas(fftCanvas); }
resizeAll();
window.addEventListener('resize', resizeAll);

// ── Helpers ────────────────────────────────────────────────────────────────
const DPR = devicePixelRatio;
function px(n) { return Math.round(n * DPR); }   // logical → physical pixels
function labelFont(size) { return `${px(size)}px system-ui, -apple-system, sans-serif`; }

function formatHz(hz) {
  if (hz >= 1000) return (hz / 1000).toFixed(hz % 1000 === 0 ? 0 : 1) + ' kHz';
  return hz + ' Hz';
}

// ── Waveform ──────────────────────────────────────────────────────────────
function drawWaveform(frame) {
  const W = waveCanvas.width, H = waveCanvas.height;
  waveCtx.fillStyle = '#0a0a14';
  waveCtx.fillRect(0, 0, W, H);

  // Zero line
  waveCtx.strokeStyle = '#2a2a4a';
  waveCtx.lineWidth = px(1);
  waveCtx.beginPath();
  waveCtx.moveTo(0, H / 2);
  waveCtx.lineTo(W, H / 2);
  waveCtx.stroke();

  // Faint ±0.5 guide lines
  waveCtx.strokeStyle = '#1a1a2e';
  for (const frac of [0.25, 0.75]) {
    waveCtx.beginPath();
    waveCtx.moveTo(0, H * frac);
    waveCtx.lineTo(W, H * frac);
    waveCtx.stroke();
  }

  // Amplitude labels on left
  waveCtx.fillStyle = '#555';
  waveCtx.font = labelFont(11);
  waveCtx.textAlign = 'left';
  waveCtx.textBaseline = 'middle';
  for (const [frac, txt] of [[0.05, '+1'], [0.5, '0'], [0.95, '−1']]) {
    waveCtx.fillText(txt, px(4), H * frac);
  }

  if (!frame?.devices.length) return;

  for (const d of frame.devices) {
    const s = d.samples;
    if (!s?.length) continue;
    waveCtx.strokeStyle = d.color;
    waveCtx.lineWidth = px(2);
    waveCtx.beginPath();
    for (let i = 0; i < s.length; i++) {
      const x = (i / s.length) * W;
      const y = (0.5 - s[i] * 0.45) * H;
      i === 0 ? waveCtx.moveTo(x, y) : waveCtx.lineTo(x, y);
    }
    waveCtx.stroke();
  }
}

// ── FFT spectrum ──────────────────────────────────────────────────────────
function drawFFT(frame) {
  const W = fftCtx.canvas.width, H = fftCtx.canvas.height;
  fftCtx.fillStyle = '#0a0a14';
  fftCtx.fillRect(0, 0, W, H);

  // Derive Nyquist from first visible device's sampleRate (default 44100)
  const sampleRate = frame?.devices?.[0]?.sampleRate ?? 44100;
  const nyquist    = sampleRate / 2;        // max freq displayed
  const fftLen     = frame?.devices?.[0]?.fft?.length ?? 256;

  // Leave room at the bottom for axis labels
  const LABEL_H = px(22);
  const plotH   = H - LABEL_H;

  // Horizontal grid lines + dB labels
  const DB_STEPS = [0.75, 0.5, 0.25]; // fractions of plotH (rough dB guides)
  fftCtx.strokeStyle = '#1a1a2e';
  fftCtx.lineWidth = px(1);
  for (const f of DB_STEPS) {
    const y = plotH * (1 - f);
    fftCtx.beginPath(); fftCtx.moveTo(0, y); fftCtx.lineTo(W, y); fftCtx.stroke();
  }

  // Frequency axis tick marks and labels
  // Choose sensible tick positions up to nyquist
  const ticksHz = buildTicks(nyquist);
  fftCtx.fillStyle = '#666';
  fftCtx.font = labelFont(11);
  fftCtx.textBaseline = 'top';

  for (const hz of ticksHz) {
    const x = (hz / nyquist) * W;
    // Tick line
    fftCtx.strokeStyle = '#2a2a4a';
    fftCtx.beginPath(); fftCtx.moveTo(x, plotH); fftCtx.lineTo(x, H); fftCtx.stroke();
    // Label (align right for last tick, left for 0, center otherwise)
    const label = formatHz(hz);
    fftCtx.textAlign = hz === 0 ? 'left' : hz >= nyquist * 0.95 ? 'right' : 'center';
    fftCtx.fillText(label, x, plotH + px(4));
  }

  if (!frame?.devices.length) return;

  for (const d of frame.devices) {
    const f = d.fft;
    if (!f?.length) continue;
    fftCtx.fillStyle = d.color + 'cc';
    const barW = W / f.length;
    for (let i = 0; i < f.length; i++) {
      const barH = Math.min(f[i] * plotH * 6, plotH);
      fftCtx.fillRect(i * barW, plotH - barH, Math.max(barW - px(1), 1), barH);
    }
  }
}

// Pick ~6 evenly spaced round-number Hz ticks up to nyquist
function buildTicks(nyquist) {
  const targets = [0, 1000, 2000, 4000, 8000, 11025, 16000, 22050];
  return targets.filter(hz => hz <= nyquist);
}

// ── Legend ─────────────────────────────────────────────────────────────────
function updateLegend(devices) {
  if (!devices?.length) {
    legend.innerHTML = '';
    legend.appendChild(noDevices);
    devCount.textContent = '0';
    return;
  }
  legend.innerHTML = '';
  for (const d of devices) {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.style.opacity = d.visible ? '1' : '0.35';
    item.innerHTML = `<span class="legend-dot" style="background:${d.color}"></span>
                      <span>${d.deviceName}</span>`;
    legend.appendChild(item);
  }
  devCount.textContent = devices.filter(d => d.visible).length;
}

// ── Render loop ────────────────────────────────────────────────────────────
function render() {
  drawWaveform(latestFrame);
  drawFFT(latestFrame);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

// ── IPC from main process ──────────────────────────────────────────────────
window.api.onDisplayFrame((frame) => {
  latestFrame = frame;
  updateLegend(frame.devices);
});

window.api.onDevicesUpdate((devices) => {
  updateLegend(devices);
  if (latestFrame) {
    latestFrame.devices = latestFrame.devices.filter(
      d => devices.find(x => x.deviceId === d.deviceId)
    );
  }
});

// ── QR lightbox ────────────────────────────────────────────────────────────
window.api.onServerInfo((info) => {
  qrImg.src = info.qrDataUrl;
  qrUrl.textContent    = 'WebSocket: ' + info.wsUrl;
  qrAppUrl.textContent = 'Tanuló app: ' + info.appUrl;
});

qrBtn.addEventListener('click', () => lightbox.classList.add('open'));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('open'); });
qrClose.addEventListener('click', () => lightbox.classList.remove('open'));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lightbox.classList.remove('open'); });

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
let serverInfo  = null;

// ── Resize canvases ────────────────────────────────────────────────────────
function resizeCanvas(canvas) {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width  = rect.width  * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
}

function resizeAll() {
  resizeCanvas(waveCanvas);
  resizeCanvas(fftCanvas);
}
resizeAll();
window.addEventListener('resize', resizeAll);

// ── Draw loop ──────────────────────────────────────────────────────────────
function drawWaveform(frame) {
  const W = waveCanvas.width, H = waveCanvas.height;
  waveCtx.fillStyle = '#0f0f1e';
  waveCtx.fillRect(0, 0, W, H);

  // Grid lines
  waveCtx.strokeStyle = '#1e1e3a'; waveCtx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = (i / 4) * H;
    waveCtx.beginPath(); waveCtx.moveTo(0, y); waveCtx.lineTo(W, y); waveCtx.stroke();
  }
  waveCtx.beginPath(); waveCtx.moveTo(0, H/2); waveCtx.lineTo(W, H/2);
  waveCtx.strokeStyle = '#2a2a4a'; waveCtx.stroke();

  if (!frame || !frame.devices.length) return;

  for (const d of frame.devices) {
    const s = d.samples;
    if (!s || !s.length) continue;
    waveCtx.strokeStyle = d.color;
    waveCtx.lineWidth   = 2 * devicePixelRatio;
    waveCtx.beginPath();
    for (let i = 0; i < s.length; i++) {
      const x = (i / s.length) * W;
      const y = (0.5 - s[i] * 0.45) * H;
      i === 0 ? waveCtx.moveTo(x, y) : waveCtx.lineTo(x, y);
    }
    waveCtx.stroke();
  }
}

function drawFFT(frame) {
  const W = fftCanvas.width, H = fftCanvas.height;
  fftCtx.fillStyle = '#0f0f1e';
  fftCtx.fillRect(0, 0, W, H);

  // Frequency axis labels (0, 1k, 2k, 4k Hz approx)
  fftCtx.fillStyle = '#333';
  fftCtx.font = `${11 * devicePixelRatio}px system-ui`;
  const labels = ['0', '500', '1k', '2k', '4k+'];
  labels.forEach((l, i) => {
    const x = (i / (labels.length - 1)) * W;
    fftCtx.fillText(l, x + 3, H - 4);
  });

  if (!frame || !frame.devices.length) return;

  for (const d of frame.devices) {
    const f = d.fft;
    if (!f || !f.length) continue;
    fftCtx.fillStyle = d.color + 'cc';
    const barW = W / f.length;
    for (let i = 0; i < f.length; i++) {
      const barH = Math.min(f[i] * H * 6, H);
      fftCtx.fillRect(i * barW, H - barH, barW - 1, barH);
    }
  }
}

function updateLegend(devices) {
  if (!devices || !devices.length) {
    legend.innerHTML = '';
    legend.appendChild(noDevices);
    return;
  }
  legend.innerHTML = '';
  for (const d of devices) {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.style.opacity = d.visible ? '1' : '0.4';
    item.innerHTML = `<span class="legend-dot" style="background:${d.color}"></span>
                      <span>${d.deviceName}</span>`;
    legend.appendChild(item);
  }
  devCount.textContent = devices.filter(d => d.visible).length;
}

function render() {
  drawWaveform(latestFrame);
  drawFFT(latestFrame);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

// ── IPC from main ──────────────────────────────────────────────────────────
window.api.onDisplayFrame((frame) => {
  latestFrame = frame;
  updateLegend(frame.devices);
});

window.api.onDevicesUpdate((devices) => {
  updateLegend(devices);
  if (latestFrame) latestFrame.devices = latestFrame.devices.filter(
    d => devices.find(x => x.deviceId === d.deviceId)
  );
});

// ── QR Lightbox ────────────────────────────────────────────────────────────
// Server info arrives via IPC from main process
window.api.onServerInfo((info) => {
  serverInfo = info;
  qrImg.src    = info.qrDataUrl;
  qrUrl.textContent    = 'WebSocket: ' + info.wsUrl;
  qrAppUrl.textContent = 'Tanuló app: ' + info.appUrl;
});

qrBtn.addEventListener('click', () => lightbox.classList.add('open'));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('open'); });
qrClose.addEventListener('click', () => lightbox.classList.remove('open'));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lightbox.classList.remove('open'); });

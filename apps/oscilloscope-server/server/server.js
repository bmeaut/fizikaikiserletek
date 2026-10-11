const https  = require('https');
const express = require('express');
const { WebSocketServer } = require('ws');
const path   = require('path');
const { getCert }    = require('./cert');
const { setPassword } = require('./auth');
const store  = require('./sessionStore');
const qrcode = require('qrcode');
const os     = require('os');

let httpsServer = null;
let wss = null;

function getLocalIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

async function startServer(port, password) {
  if (password) await setPassword(password);

  const { cert, key } = await getCert();
  const app = express();
  app.use(express.json());

  // Serve the student PWA from apps/oscilloscope/
  const pwaPath = path.join(__dirname, '..', '..', 'oscilloscope');
  app.use('/app', express.static(pwaPath));

  // Ping endpoint — student PWA polls this to detect when cert is accepted
  app.get('/ping', (req, res) => res.json({ ok: true }));

  // Root: cert-acceptance landing page (auto-closes and notifies opener)
  app.get('/', (req, res) => res.send(`<!DOCTYPE html>
<html lang="hu"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Csatlakozás…</title>
<style>
  body{font-family:system-ui,sans-serif;background:#1a1a2e;color:#e0e0e0;
       display:flex;flex-direction:column;align-items:center;justify-content:center;
       min-height:100vh;gap:1rem;padding:2rem;text-align:center;}
  h1{font-size:1.3rem;color:#9fa8da;}
  p{color:#888;font-size:.9rem;line-height:1.5;}
</style></head><body>
<h1>✅ Tanúsítvány elfogadva</h1>
<p>Ezt az ablakot bezárhatod és visszatérhetsz az alkalmazáshoz.</p>
<script>
  if(window.opener){try{window.opener.postMessage('cert-accepted','*');}catch(e){}}
  setTimeout(()=>window.close(),800);
</script>
</body></html>`));

  httpsServer = https.createServer({ cert, key }, app);
  wss = new WebSocketServer({ server: httpsServer, path: '/ws' });

  wss.on('connection', (ws) => {
    let deviceId = null;

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      if (msg.type === 'hello') {
        deviceId = msg.deviceId;
        store.registerDevice(deviceId, msg.deviceName, ws);
        if (global.onDevicesUpdate) global.onDevicesUpdate(store.getDevices());
      }

      if (msg.type === 'audio' && deviceId) {
        store.addSamples(deviceId, msg.t, msg.samples, msg.sampleRate);
        // Build and push display frame
        if (global.onDisplayFrame) {
          global.onDisplayFrame(store.buildFrame());
        }
      }
    });

    ws.on('close', () => {
      if (deviceId) {
        store.removeDevice(deviceId);
        if (global.onDevicesUpdate) global.onDevicesUpdate(store.getDevices());
      }
    });
  });

  await new Promise((res, rej) =>
    httpsServer.listen(port, (err) => err ? rej(err) : res())
  );

  const ip     = getLocalIp();
  const wsUrl  = `wss://${ip}:${port}/ws`;
  const appUrl = `https://${ip}:${port}/`;
  // QR encodes the HTTPS root URL — student scans it, browser opens it,
  // accepts the cert warning, then the page auto-closes and the PWA connects.
  const qrDataUrl = await qrcode.toDataURL(appUrl, { width: 300, margin: 1 });

  return { ip, port, wsUrl, appUrl, qrDataUrl };
}

function stopServer() {
  if (wss)         { wss.close(); wss = null; }
  if (httpsServer) { httpsServer.close(); httpsServer = null; }
  store.clear();
}

module.exports = { startServer, stopServer };

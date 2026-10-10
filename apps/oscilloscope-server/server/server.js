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

  // Redirect root to student app
  app.get('/', (req, res) => res.redirect('/app/'));

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

  const ip    = getLocalIp();
  const wsUrl = `wss://${ip}:${port}/ws`;
  const appUrl = `https://${ip}:${port}/app/`;
  const qrDataUrl = await qrcode.toDataURL(wsUrl, { width: 300, margin: 1 });

  return { ip, port, wsUrl, appUrl, qrDataUrl };
}

function stopServer() {
  if (wss)         { wss.close(); wss = null; }
  if (httpsServer) { httpsServer.close(); httpsServer = null; }
  store.clear();
}

module.exports = { startServer, stopServer };

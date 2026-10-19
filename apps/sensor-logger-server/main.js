const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { startServer, stopServer } = require('./server/server');

let win = null;

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 1400,
    height: 800,
    minWidth: 900,
    minHeight: 500,
    title: 'Sensor Logger Szerver',
    backgroundColor: '#0f0f1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  win.setMenu(null);
  win.maximize();
  win.loadFile('renderer/index.html');
  win.on('closed', () => { stopServer(); app.quit(); });
});

app.on('window-all-closed', () => { stopServer(); app.quit(); });

// ── IPC ───────────────────────────────────────────────────────────────────

ipcMain.handle('server:start', async (_, { port }) => {
  try {
    await startServer(port);
    const os = require('os');
    const ip = getLocalIp();
    return { ok: true, ip, port, url: `http://${ip}:${port}/data` };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('server:stop', () => { stopServer(); return { ok: true }; });

function getLocalIp() {
  const os = require('os');
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

// Called by server.js when new sensor data arrives
global.onSensorData = (batch) => {
  if (win) win.webContents.send('sensor:data', batch);
};

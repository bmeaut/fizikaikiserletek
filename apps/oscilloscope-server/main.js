const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { randomUUID } = require('crypto');
const { startServer, stopServer } = require('./server/server');
const { verifyPassword, changePassword, isFirstRun } = require('./server/auth');
const { ensureCerts, regenerateServerCert, isCaInstalled, tryInstallCaElevated } = require('./server/ca');

let launcherWin = null;
let displayWin  = null;
let controlWin  = null;
let caStatus    = 'unknown'; // 'trusted' | 'fallback' | 'pending'

function createLauncher() {
  launcherWin = new BrowserWindow({
    width: 480, height: 560,
    resizable: false,
    title: 'Oszcilloszkóp Szerver',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  launcherWin.setMenu(null);
  launcherWin.loadFile('renderer/launcher.html');
}

function createDisplay() {
  displayWin = new BrowserWindow({
    width: 1280, height: 800,
    title: 'Oszcilloszkóp — Projektor nézet',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  displayWin.setMenu(null);
  displayWin.maximize();
  displayWin.loadFile('renderer/display.html');
  displayWin.on('closed', () => { displayWin = null; });
}

function createControl() {
  if (controlWin) { controlWin.focus(); return; }
  controlWin = new BrowserWindow({
    width: 560, height: 700,
    title: 'Tanári vezérlőpult',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  controlWin.setMenu(null);
  controlWin.loadFile('renderer/control.html');
  controlWin.on('closed', () => {
    controlWin = null;
    stopServer();
    app.quit();
  });
}

app.whenReady().then(async () => {
  // Ensure certs exist and are up to date for the current network
  ensureCerts();
  regenerateServerCert(); // refresh server cert IPs on every launch

  if (isCaInstalled()) {
    caStatus = 'trusted';
    createLauncher();
  } else {
    // Attempt elevated CA install once; show launcher regardless of outcome
    caStatus = 'pending';
    createLauncher(); // open launcher immediately so teacher isn't waiting
    tryInstallCaElevated().then((result) => {
      caStatus = result.ok ? 'trusted' : 'fallback';
      if (launcherWin) launcherWin.webContents.send('ca:status', caStatus);
    });
  }
});
app.on('window-all-closed', () => { stopServer(); app.quit(); });

// ── IPC handlers ──────────────────────────────────────────────────────────

ipcMain.handle('server:start', async (_, { port, password }) => {
  try {
    const info = await startServer(port, password);
    // Open display and control windows
    createDisplay();
    createControl();
    if (launcherWin) launcherWin.hide();
    // Push server info to display once its DOM is ready
    if (displayWin) {
      displayWin.webContents.once('did-finish-load', () => {
        displayWin.webContents.send('server-info', info);
      });
    }
    return { ok: true, ...info };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('server:stop', () => {
  stopServer();
  if (displayWin)  { displayWin.close();  }
  if (controlWin)  { controlWin.close();  }
  if (launcherWin) { launcherWin.show();  }
});

ipcMain.handle('server:is-first-run', () => isFirstRun());
ipcMain.handle('ca:status', () => caStatus);

ipcMain.handle('devices:list', (_, { token }) => {
  if (!verifyToken(token)) return { ok: false };
  const { getDevices } = require('./server/sessionStore');
  return { ok: true, devices: getDevices() };
});

ipcMain.handle('device:toggle', (_, { token, deviceId }) => {
  if (!verifyToken(token)) return { ok: false };
  const { toggleDevice } = require('./server/sessionStore');
  return { ok: true, devices: toggleDevice(deviceId) };
});

ipcMain.handle('device:rename', (_, { token, deviceId, name }) => {
  if (!verifyToken(token)) return { ok: false };
  const { renameDevice } = require('./server/sessionStore');
  return { ok: true, devices: renameDevice(deviceId, name) };
});

ipcMain.handle('password:verify', async (_, { password }) => {
  const ok = await verifyPassword(password);
  if (ok) activeToken = randomUUID();
  return { ok, token: ok ? activeToken : null };
});

ipcMain.handle('password:change', async (_, { token, newPassword }) => {
  if (!verifyToken(token)) return { ok: false };
  await changePassword(newPassword);
  return { ok: true };
});

// Push frames from server to display renderer
let activeToken = null;
function verifyToken(t) { return t && t === activeToken; }

// Called by server.js when a new audio frame is ready for the display
global.onDisplayFrame = (frame) => {
  if (displayWin) displayWin.webContents.send('display:frame', frame);
};
global.onDevicesUpdate = (devices) => {
  if (displayWin)  displayWin.webContents.send('display:devices-update', devices);
  if (controlWin)  controlWin.webContents.send('control:devices-update', devices);
};

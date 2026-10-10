const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Server control
  serverStart:     (opts)  => ipcRenderer.invoke('server:start', opts),
  serverStop:      ()      => ipcRenderer.invoke('server:stop'),
  serverIsFirstRun: ()     => ipcRenderer.invoke('server:is-first-run'),

  // Devices
  devicesList:  (token)              => ipcRenderer.invoke('devices:list',   { token }),
  deviceToggle: (token, deviceId)    => ipcRenderer.invoke('device:toggle',  { token, deviceId }),
  deviceRename: (token, deviceId, n) => ipcRenderer.invoke('device:rename',  { token, deviceId, name: n }),

  // Session data
  exportCsv: (token) => ipcRenderer.invoke('session:export-csv', { token }),
  importCsv: (token) => ipcRenderer.invoke('session:import-csv', { token }),

  // Auth
  passwordVerify: (pw)        => ipcRenderer.invoke('password:verify', { password: pw }),
  passwordChange: (token, pw) => ipcRenderer.invoke('password:change', { token, newPassword: pw }),

  // Renderer listeners
  onDisplayFrame:      (cb) => ipcRenderer.on('display:frame',          (_, d) => cb(d)),
  onDevicesUpdate:     (cb) => ipcRenderer.on('display:devices-update', (_, d) => cb(d)),
  onControlDevices:    (cb) => ipcRenderer.on('control:devices-update', (_, d) => cb(d)),
  onServerInfo:        (cb) => ipcRenderer.on('server-info',            (_, d) => cb(d)),
});

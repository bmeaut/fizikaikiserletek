const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  serverStart: (opts) => ipcRenderer.invoke('server:start', opts),
  serverStop:  ()     => ipcRenderer.invoke('server:stop'),
  onSensorData: (cb)  => ipcRenderer.on('sensor:data', (_, d) => cb(d)),
});

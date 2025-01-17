const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainProcess('electron', {
  close: () => ipcRenderer.send('close-app')
})
const { contextBridge, ipcRenderer } = require('electron');
// A one-way startup acknowledgement; the game receives no filesystem or Node API.
contextBridge.exposeInMainWorld('mandalingoDesktop', {
  rendered: () => ipcRenderer.send('courtyard-rendered')
});

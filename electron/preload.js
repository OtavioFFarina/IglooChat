const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('igloochatDesktop', {
  isElectron: true,
  platform: process.platform,
  getScreenSources: async (opts) => {
    return await ipcRenderer.invoke('desktop-capturer-get-sources', opts);
  },
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close')
});

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getIdleTime: () => ipcRenderer.invoke('get-idle-time'),
  sendNotification: (title: string, body: string, icon?: string) =>
    ipcRenderer.invoke('send-notification', { title, body, icon }),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  hideWindow: () => ipcRenderer.send('window-hide'),
  closeWindow: () => ipcRenderer.send('window-close'),
  onIdleStateChange: (callback: (data: { idleTime: number; isIdle: boolean }) => void) => {
    ipcRenderer.on('idle-state-changed', (_event, value) => callback(value));
  },
});

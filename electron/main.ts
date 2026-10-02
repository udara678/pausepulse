import { app, BrowserWindow, ipcMain, Notification, powerMonitor, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let idleCheckInterval: NodeJS.Timeout | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 680,
    minWidth: 860,
    minHeight: 600,
    show: false,
    frame: false,
    resizable: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('blur', () => {
    // Keep window open during dev, can auto-hide in production tray mode
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'PausePulse Wellness Dashboard', click: () => showWindow() },
    { type: 'separator' },
    { label: 'Take Micro Break', click: () => triggerBreakNotification('Micro Break Time', 'Time to step away from your screen for 3 minutes!') },
    { label: 'Hydration Reminder', click: () => triggerBreakNotification('Hydration Check', 'Drink a fresh glass of water (250ml)! 💧') },
    { type: 'separator' },
    { label: 'Quit PausePulse', click: () => app.quit() },
  ]);

  tray.setToolTip('PausePulse - Ergonomic Health & Pacing');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => toggleWindow());
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    showWindow();
  }
}

function showWindow() {
  if (!mainWindow) return;
  mainWindow.show();
  mainWindow.focus();
}

function triggerBreakNotification(title: string, body: string) {
  if (Notification.isSupported()) {
    new Notification({
      title: `⚡ PausePulse: ${title}`,
      body,
      silent: false,
    }).show();
  }
}

function startIdleMonitor() {
  idleCheckInterval = setInterval(() => {
    const idleTimeSeconds = powerMonitor.getSystemIdleTime();
    const isIdle = idleTimeSeconds > 300; // 5 mins idle

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('idle-state-changed', {
        idleTime: idleTimeSeconds,
        isIdle,
      });
    }
  }, 5000);
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  startIdleMonitor();

  ipcMain.handle('get-idle-time', () => {
    return powerMonitor.getSystemIdleTime();
  });

  ipcMain.handle('send-notification', (_event, { title, body }) => {
    triggerBreakNotification(title, body);
    return true;
  });

  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-hide', () => mainWindow?.hide());
  ipcMain.on('window-close', () => mainWindow?.hide());

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (idleCheckInterval) clearInterval(idleCheckInterval);
});

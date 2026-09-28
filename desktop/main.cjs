const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

app.setName('Mandalingo');
const smoke = process.argv.includes('--smoke-test');
const reportPath = process.env.MANDALINGO_SMOKE_REPORT;
const errors = [];
let gameWindow;
let rendered = false;
if (smoke && reportPath) app.setPath('userData', path.join(path.dirname(reportPath), 'smoke-profile'));

function finishSmoke(ok, extra = {}) {
  if (reportPath) fs.writeFileSync(reportPath, JSON.stringify({ ok, errors, ...extra }, null, 2));
  app.exit(ok ? 0 : 1);
}

app.whenReady().then(async () => {
  gameWindow = new BrowserWindow({
    title: 'Mandalingo — The South Gate', width: 1440, height: 900,
    minWidth: 960, minHeight: 640, backgroundColor: '#172c2b',
    show: false, autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, backgroundThrottling: true }
  });
  ipcMain.on('courtyard-rendered', event => { if (event.sender === gameWindow.webContents) rendered = true; });
  Menu.setApplicationMenu(Menu.buildFromTemplate([{
    label: 'Game', submenu: [
      { label: 'Fullscreen', accelerator: 'F11', click: () => gameWindow.setFullScreen(!gameWindow.isFullScreen()) },
      { type: 'separator' }, { role: 'quit', label: 'Quit Mandalingo' }
    ]
  }]));
  gameWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  gameWindow.webContents.on('will-navigate', event => event.preventDefault());
  gameWindow.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  gameWindow.webContents.on('render-process-gone', (_event, details) => { errors.push(details.reason); if (smoke) finishSmoke(false); });
  gameWindow.webContents.on('console-message', (_event, details) => {
    if (details.level === 'error') errors.push(details.message);
  });
  gameWindow.once('ready-to-show', () => { if (!smoke) gameWindow.show(); });
  try {
    await gameWindow.loadFile(path.join(__dirname, '..', 'index.html'));
    if (smoke) setTimeout(() => finishSmoke(errors.length === 0 && rendered, {
      rendered, title: gameWindow.getTitle(), gpu: app.getGPUFeatureStatus(), electron: process.versions.electron
    }), 3000);
  } catch (error) { errors.push(error.message); if (smoke) finishSmoke(false); }
});
app.on('window-all-closed', () => app.quit());
if (smoke) setTimeout(() => finishSmoke(false, { reason: 'startup timeout' }), 20000).unref();

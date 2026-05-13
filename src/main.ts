import { app, BrowserWindow } from 'electron';
import { existsSync, renameSync } from 'node:fs';
import path from 'node:path';
import started from 'electron-squirrel-startup';

const APP_NAME = 'EcoHub SAF Client';

const configureAppPaths = () => {
  app.setName(APP_NAME);

  if (process.platform !== 'darwin') {
    return;
  }

  const cacheRoot = path.join(app.getPath('home'), 'Library', 'Caches');
  const oldCachePath = path.join(cacheRoot, 'ecohub-saf-client');
  const appCachePath = path.join(cacheRoot, APP_NAME);

  try {
    if (existsSync(oldCachePath) && !existsSync(appCachePath)) {
      renameSync(oldCachePath, appCachePath);
    }
  } catch (error) {
    console.warn('Unable to migrate legacy cache directory.', error);
  }

  app.commandLine.appendSwitch('disk-cache-dir', appCachePath);
};

configureAppPaths();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: 'EcoHub SAF Client',
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

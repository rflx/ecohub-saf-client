import { app, BrowserWindow, ipcMain } from 'electron';
import { existsSync, renameSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import started from 'electron-squirrel-startup';

const APP_NAME = 'EcoHub SAF Client';
const SAF_API_REQUEST_JSON_CHANNEL = 'saf-api:request-json';

type SafApiHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type SafApiJsonRequest = {
  method: SafApiHttpMethod;
  url: string;
  timeoutMs: number;
  body?: unknown;
  headers?: Record<string, string>;
};

type SafApiJsonResponse = {
  ok: boolean;
  status: number;
  responseBody: unknown;
  responseHeaders?: Record<string, string>;
  networkError?: string;
};

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

ipcMain.handle(
  SAF_API_REQUEST_JSON_CHANNEL,
  async (_event, request: SafApiJsonRequest): Promise<SafApiJsonResponse> => {
    validateSafApiJsonRequest(request);

    try {
      return await requestJsonWithNodeRequest(request);
    } catch (error) {
      return {
        ok: false,
        status: 0,
        responseBody: undefined,
        networkError: createNetworkErrorMessage(error, request.timeoutMs),
      };
    }
  },
);

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

function requestJsonWithNodeRequest(request: SafApiJsonRequest): Promise<SafApiJsonResponse> {
  const url = new URL(request.url);
  const hasBody = request.body !== undefined;
  const requestBody = hasBody ? JSON.stringify(request.body) : undefined;
  const transport = url.protocol === 'https:' ? https : http;
  const headers: Record<string, string | number> = {
    Accept: 'application/json',
    ...request.headers,
  };

  if (requestBody !== undefined) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    headers['Content-Length'] = Buffer.byteLength(requestBody);
  }

  return new Promise((resolve, reject) => {
    const nodeRequest = transport.request(
      url,
      {
        method: request.method,
        headers,
        timeout: request.timeoutMs,
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer | string) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        response.on('end', () => {
          const status = response.statusCode ?? 0;
          const responseText = Buffer.concat(chunks).toString('utf8');

          resolve({
            ok: status >= 200 && status < 300,
            status,
            responseBody: parseJsonResponse(responseText),
            responseHeaders: normalizeResponseHeaders(response.headers),
          });
        });
      },
    );

    nodeRequest.on('timeout', () => {
      nodeRequest.destroy(new Error(`SAF API request timed out after ${request.timeoutMs} ms.`));
    });

    nodeRequest.on('error', reject);

    if (requestBody !== undefined) {
      nodeRequest.write(requestBody);
    }

    nodeRequest.end();
  });
}

function normalizeResponseHeaders(headers: http.IncomingHttpHeaders): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).flatMap(([key, value]) => {
    if (value === undefined) return [];
    return [[key, Array.isArray(value) ? value.join(', ') : String(value)]];
  }));
}

function parseJsonResponse(responseText: string): unknown {
  if (!responseText) {
    return undefined;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

function validateSafApiJsonRequest(request: SafApiJsonRequest): void {
  if (typeof request?.url !== 'string' || !request.url.trim()) {
    throw new Error('SAF API URL ist erforderlich.');
  }

  const url = new URL(request.url);

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`SAF API URL-Protokoll wird nicht unterstuetzt: ${url.protocol}`);
  }

  if (!Number.isFinite(request.timeoutMs) || request.timeoutMs <= 0) {
    throw new Error('SAF API Timeout muss groesser als 0 sein.');
  }

  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    throw new Error(`SAF API HTTP-Methode wird nicht unterstuetzt: ${request.method}`);
  }
}

function createNetworkErrorMessage(error: unknown, timeoutMs: number): string {
  if (error instanceof Error && error.message.includes(`timed out after ${timeoutMs} ms`)) {
    return `SAF API request timed out after ${timeoutMs} ms.`;
  }

  return error instanceof Error ? error.message : 'SAF API request failed.';
}

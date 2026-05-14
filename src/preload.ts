import { contextBridge, ipcRenderer } from 'electron';

const SAF_API_REQUEST_JSON_CHANNEL = 'saf-api:request-json';

type SafApiJsonRequest = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  timeoutMs: number;
  body?: unknown;
  headers?: Record<string, string>;
};

contextBridge.exposeInMainWorld('safApi', {
  requestJson: (request: SafApiJsonRequest) => ipcRenderer.invoke(SAF_API_REQUEST_JSON_CHANNEL, request),
});

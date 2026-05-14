import { contextBridge, ipcRenderer } from 'electron';

const SAF_API_POST_JSON_CHANNEL = 'saf-api:post-json';

type SafApiPostJsonRequest = {
  url: string;
  timeoutMs: number;
  body: unknown;
};

contextBridge.exposeInMainWorld('safApi', {
  postJson: (request: SafApiPostJsonRequest) => ipcRenderer.invoke(SAF_API_POST_JSON_CHANNEL, request),
});

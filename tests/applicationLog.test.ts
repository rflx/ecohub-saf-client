import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applicationLogService,
  ApplicationLogService,
  MAX_APPLICATION_LOG_BODY_CHARS,
  MAX_APPLICATION_LOG_ENTRIES,
  REDACTED_VALUE,
  sanitizeForApplicationLog,
  type ApplicationLogStorage,
} from '../src/renderer/services/applicationLog/ApplicationLogService';
import type { ApplicationLogEntry } from '../src/renderer/models';
import { formatZurichTime } from '../src/renderer/pages/LogsPage';
import { SafApiHttpService, type SafApiJsonResponse } from '../src/saf/services/SafApiHttpService';

class MemoryStorage implements ApplicationLogStorage {
  entries: ApplicationLogEntry[] = [];
  load() { return this.entries; }
  save(entries: ApplicationLogEntry[]) { this.entries = [...entries]; }
  clear() { this.entries = []; }
}

class TestHttpService extends SafApiHttpService {
  call() { return this.requestJson({ method: 'POST', url: 'https://local.test/api', timeoutMs: 100, body: { password: 'secret' } }); }
}

test('maskiert sensible Request- und Response-Felder rekursiv', () => {
  const sanitized = sanitizeForApplicationLog({
    password: 'secret', Authorization: 'Bearer token', nested: [{ clientSecret: 'secret' }],
    response: { techUserCert: 'certificate', safe: 'visible' },
  }) as Record<string, unknown>;
  assert.equal(sanitized.password, REDACTED_VALUE);
  assert.equal(sanitized.Authorization, REDACTED_VALUE);
  assert.deepEqual(sanitized.nested, [{ clientSecret: REDACTED_VALUE }]);
  assert.deepEqual(sanitized.response, { techUserCert: REDACTED_VALUE, safe: 'visible' });
});

test('begrenzt Body-Groesse und maximale Log-Anzahl', () => {
  const storage = new MemoryStorage();
  const service = new ApplicationLogService(storage);
  for (let index = 0; index <= MAX_APPLICATION_LOG_ENTRIES; index += 1) {
    const id = service.startOperation({ transport: 'rest', requestBody: { values: Array.from({ length: MAX_APPLICATION_LOG_BODY_CHARS }, () => 'xx') } });
    service.completeOperation(id, { httpStatus: 200 });
  }
  assert.equal(service.getEntries().length, MAX_APPLICATION_LOG_ENTRIES);
  assert.equal((service.getEntries()[0].requestBody as { truncated: boolean }).truncated, true);
});

test('bildet erfolgreichen, HTTP-Fehler- und Netzwerkfehler-Ablauf ab', () => {
  const service = new ApplicationLogService(new MemoryStorage());
  const successId = service.startOperation({ transport: 'rest', method: 'POST', url: 'https://local.test/api' });
  service.completeOperation(successId, { httpStatus: 200, responseBody: { ok: true } });
  const httpId = service.startOperation({ transport: 'rest' });
  service.failOperation(httpId, { httpStatus: 400, errorCode: 'INVALID', errorMessage: 'Invalid request' });
  const networkId = service.startOperation({ transport: 'rest' });
  service.failOperation(networkId, { errorCode: 'ECONNREFUSED', errorMessage: 'Connection refused' });
  const [network, http, success] = service.getEntries();
  assert.equal(success.status, 'success'); assert.equal(success.httpStatus, 200);
  assert.equal(http.status, 'error'); assert.equal(http.httpStatus, 400);
  assert.equal(network.status, 'error'); assert.equal(network.errorCode, 'ECONNREFUSED');
});

test('SafApiHttpService protokolliert Erfolg, HTTP-Fehler und Netzwerkfehler automatisch', async () => {
  const httpService = new TestHttpService();
  const setResponse = (response: SafApiJsonResponse) => {
    (globalThis as unknown as { window: unknown }).window = { safApi: { requestJson: async () => response } };
  };
  applicationLogService.clear();
  setResponse({ ok: true, status: 201, responseHeaders: { server: 'test' }, responseBody: { result: 'ok' } });
  await httpService.call();
  setResponse({ ok: false, status: 400, responseBody: { errorCode: 'INVALID', errorMessage: 'Invalid' } });
  await assert.rejects(httpService.call());
  setResponse({ ok: false, status: 0, responseBody: undefined, networkError: 'ECONNREFUSED' });
  await assert.rejects(httpService.call());
  const [network, http, success] = applicationLogService.getEntries();
  assert.equal(success.status, 'success'); assert.equal(success.httpStatus, 201);
  assert.equal(http.errorCode, 'INVALID'); assert.equal(http.httpStatus, 400);
  assert.equal(network.errorCode, 'ECONNREFUSED'); assert.equal(network.status, 'error');
  assert.deepEqual(success.requestBody, { password: REDACTED_VALUE });
});

test('formatiert Sommer- und Winterzeit fuer Europe/Zurich dynamisch', () => {
  assert.match(formatZurichTime('2026-07-20T12:25:31.000Z'), /20\.07\.2026.*14:25:31.*GMT\+2/);
  assert.match(formatZurichTime('2026-01-20T12:25:31.000Z'), /20\.01\.2026.*13:25:31.*GMT\+1/);
});

import { useMemo, useState, useSyncExternalStore } from 'react';
import type { ApplicationLogEntry, ApplicationLogStatus, ApplicationLogTransport } from '../models';
import { applicationLogService } from '../services';

type StatusFilter = ApplicationLogStatus | 'all';
type TransportFilter = ApplicationLogTransport | 'all';

export function LogsPage() {
  const entries = useSyncExternalStore(
    applicationLogService.subscribe,
    applicationLogService.getEntries,
    applicationLogService.getEntries,
  );
  const [status, setStatus] = useState<StatusFilter>('all');
  const [transport, setTransport] = useState<TransportFilter>('all');
  const [search, setSearch] = useState('');
  const filteredEntries = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return entries.filter((entry) =>
      (status === 'all' || entry.status === status) &&
      (transport === 'all' || entry.transport === transport) &&
      (!needle || [entry.apiName, entry.apiId, entry.operationName, entry.operationId, entry.url,
        entry.profileName, entry.profileId, entry.environmentId, entry.errorMessage]
        .some((value) => value?.toLowerCase().includes(needle))),
    );
  }, [entries, search, status, transport]);

  const clearLogs = () => {
    if (window.confirm('Alle technischen Logs unwiderruflich löschen?')) applicationLogService.clear();
  };

  return (
    <div className="page-stack">
      <section className="placeholder-panel logs-panel">
        <div className="panel-header">
          <div><h2>Technische Logs</h2><p>Automatisch protokollierte REST-Operationen und vorbereitete Kafka-Operationen.</p></div>
          <button className="button button--danger" disabled={!entries.length} onClick={clearLogs}>Logs löschen</button>
        </div>
        <div className="log-filters">
          <label className="field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
            <option value="all">Alle</option><option value="pending">Pending</option><option value="success">Erfolgreich</option><option value="error">Fehler</option>
          </select></label>
          <label className="field"><span>Transport</span><select value={transport} onChange={(event) => setTransport(event.target.value as TransportFilter)}>
            <option value="all">Alle</option><option value="rest">REST</option><option value="kafka">Kafka</option>
          </select></label>
          <label className="field log-search"><span>Suche</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="API, Operation, URL, Profil, Fehler" /></label>
        </div>
        {!filteredEntries.length ? (
          <div className="log-empty">{entries.length ? 'Keine Logs entsprechen den Filtern.' : 'Noch keine technischen Logs vorhanden.'}</div>
        ) : (
          <div className="log-list">{filteredEntries.map((entry) => <LogItem key={entry.id} entry={entry} />)}</div>
        )}
      </section>
    </div>
  );
}

function LogItem({ entry }: { entry: ApplicationLogEntry }) {
  return (
    <details className="log-entry">
      <summary>
        <time>{formatZurichTime(entry.timestampUtc)}</time>
        <span className={`log-status log-status--${entry.status}`}>{entry.status}</span>
        <strong>{entry.transport.toUpperCase()} {entry.method ?? ''}</strong>
        <span>{entry.apiName ?? entry.apiId ?? '–'} / {entry.operationName ?? entry.operationId ?? '–'}</span>
        <span>HTTP {entry.httpStatus ?? '–'}</span><span>{entry.durationMs === undefined ? '–' : `${entry.durationMs} ms`}</span>
        <span>{entry.profileName ?? entry.profileId ?? '–'} · {entry.environmentId ?? '–'}</span>
        <code>{entry.url ?? '–'}</code>
      </summary>
      <div className="log-details">
        <Detail title="Zuordnung" value={{ correlationId: entry.correlationId, timestampUtc: entry.timestampUtc,
          completedAtUtc: entry.completedAtUtc, transport: entry.transport, apiId: entry.apiId, apiName: entry.apiName,
          apiVersion: entry.apiVersion, operationId: entry.operationId, operationName: entry.operationName,
          profileId: entry.profileId, profileName: entry.profileName, environmentId: entry.environmentId,
          method: entry.method, url: entry.url, httpStatus: entry.httpStatus, durationMs: entry.durationMs }} />
        <Detail title="Request Headers" value={entry.requestHeaders} />
        <Detail title="Request Body" value={entry.requestBody} />
        <Detail title="Response Headers" value={entry.responseHeaders} />
        <Detail title="Response Body" value={entry.responseBody} />
        {(entry.errorCode || entry.errorMessage) && <Detail title="Fehler" value={{ errorCode: entry.errorCode, errorMessage: entry.errorMessage }} />}
        {entry.metadata && <Detail title="Metadaten" value={entry.metadata} />}
      </div>
    </details>
  );
}

function Detail({ title, value }: { title: string; value: unknown }) {
  if (value === undefined) return null;
  return <section><h3>{title}</h3><pre>{JSON.stringify(value, null, 2)}</pre></section>;
}

export function formatZurichTime(timestampUtc: string): string {
  const options = {
    timeZone: 'Europe/Zurich', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset',
  } as unknown as Intl.DateTimeFormatOptions;
  return new Intl.DateTimeFormat('de-CH', options).format(new Date(timestampUtc));
}

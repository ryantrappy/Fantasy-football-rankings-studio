import { useId, useState, type ReactNode } from 'react';
import type { SeasonRecord } from '../../league-summary';
import { reportFreshnessLabel } from '../report-freshness';

export interface RecordEvidenceEntry {
  id: string;
  title: string;
  detail: ReactNode;
  year?: number;
}

/** Selection belongs to the current manager/filter scope, never to a previous record set. */
export function RecordEvidence({
  entries,
  scope,
  records,
  empty = 'No supported records in this selection. Missing evidence is not counted as zero.',
}: {
  entries: RecordEvidenceEntry[];
  scope: string;
  records: SeasonRecord[];
  empty?: string;
}) {
  const headingId = useId();
  const [selection, setSelection] = useState({ scope, id: '' });
  const entry =
    (selection.scope === scope && entries.find((row) => row.id === selection.id)) || entries[0];
  const sources = entry?.year ? records.filter((record) => record.year === entry.year) : records;
  return (
    <aside className="history-record-evidence" aria-labelledby={headingId}>
      <h3 id={headingId}>Record evidence</h3>
      {entries.length > 1 && (
        <label>
          Inspect record
          <select
            value={entry?.id ?? ''}
            onChange={(event) => setSelection({ scope, id: event.target.value })}
          >
            {entries.map((row) => (
              <option key={row.id} value={row.id}>
                {row.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {entry ? (
        <>
          <h4>{entry.title}</h4>
          <div className="history-record-detail">{entry.detail}</div>
        </>
      ) : (
        <p>{empty}</p>
      )}
      <details className="history-record-sources">
        <summary>Loaded source reports ({sources.length})</summary>
        <ul>
          {sources.map(({ year, data }) => (
            <li key={year}>
              {year}: through completed week {data.completedWeek}.{' '}
              {reportFreshnessLabel(data.generatedAt)}.
              {!!data.partialFailures?.length &&
                ' Some provider sections are partially available; see coverage in this view.'}
            </li>
          ))}
        </ul>
        {!sources.length && <p>No loaded source report is available.</p>}
      </details>
    </aside>
  );
}

export function RecordEvidenceLayout({
  children,
  evidence,
}: {
  children: ReactNode;
  evidence: ReactNode;
}) {
  return (
    <div className="history-record-layout">
      <div className="history-record-main">{children}</div>
      {evidence}
    </div>
  );
}

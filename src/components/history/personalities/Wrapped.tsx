import { useContext, useState } from 'react';
import type { SeasonRecord } from '../../../league-summary';
import { ApiContext } from '../../../auth/session';
import { ReportSharing } from '../../ReportSharing';
import { buildWrapped, type WrappedRecap } from '../../../history/personalities/wrapped';
import { managerKey } from '../../../history/personalities/common';
export function WrappedPreview({ recap }: { recap: WrappedRecap }) {
  return (
    <article
      aria-label="Wrapped share preview"
      style={{
        maxWidth: 720,
        width: '100%',
        boxSizing: 'border-box',
        overflowWrap: 'anywhere',
        padding: 'clamp(12px,4vw,28px)',
        border: '1px solid currentColor',
        borderRadius: 16,
      }}
    >
      <p>
        Fantasy Wrapped · {recap.scope} · {recap.year}
      </p>
      <h2>{recap.title}</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))',
          gap: 16,
        }}
      >
        {recap.highlights.map((text, i) => (
          <p
            key={i}
            style={{ margin: 0, padding: 12, border: '1px solid currentColor', borderRadius: 8 }}
          >
            {text}
          </p>
        ))}
      </div>
      {!recap.highlights.length && <p>No supported highlights yet.</p>}
      <details>
        <summary>Coverage and methods</summary>
        <ul>
          {recap.coverage.map((text, i) => (
            <li key={i}>{text}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}
export function Wrapped({
  records,
  leagueId,
  shared = false,
}: {
  records: SeasonRecord[];
  leagueId?: string;
  shared?: boolean;
}) {
  const api = useContext(ApiContext),
    [selectedYear, setYear] = useState(records[0]?.year),
    [key, setKey] = useState(''),
    [consent, setConsent] = useState(false),
    [href, setHref] = useState(''),
    [error, setError] = useState(''),
    [saving, setSaving] = useState(false);
  const record = records.find((r) => r.year === selectedYear) || records[0];
  if (!record) return null;
  const recap = buildWrapped(record, key);
  function reset() {
    setConsent(false);
    setHref('');
    setError('');
  }
  return (
    <details>
      <summary>Personal and league Fantasy Wrapped</summary>
      <label>
        Wrapped season{' '}
        <select
          disabled={saving}
          value={record.year}
          onChange={(e) => {
            setYear(Number(e.target.value));
            setKey('');
            reset();
          }}
        >
          {records.map((r) => (
            <option key={r.year} value={r.year}>
              {r.year}
            </option>
          ))}
        </select>
      </label>
      <label>
        Wrapped manager{' '}
        <select
          disabled={saving}
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            reset();
          }}
        >
          <option value="">League recap</option>
          {record.data.teams.map((t) => (
            <option key={t.teamId} value={managerKey(record.year, t)}>
              {t.managerName}
            </option>
          ))}
        </select>
      </label>
      <WrappedPreview recap={recap} />
      {!shared && leagueId && api?.createReportSnapshot && (
        <div>
          <p>
            Only the preview's cards are published. Raw history, other managers' profiles and
            provider account IDs are excluded. Snapshot expires in 10 days. Disable public report
            sharing below to revoke existing links.
          </p>
          <label>
            <input
              type="checkbox"
              disabled={saving}
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />{' '}
            Publish this preview to anyone with its link
          </label>
          <button
            type="button"
            disabled={!consent || saving}
            onClick={async () => {
              setSaving(true);
              setError('');
              try {
                const result = await api.createReportSnapshot!({
                  leagueId,
                  view: 'wrapped',
                  records: [],
                  activeSeason: recap.year,
                  activeManagerKeys: [],
                  wrapped: recap,
                });
                setHref(`/shared/snapshots/${result.publicId}`);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not save snapshot.');
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Saving snapshot…' : 'Create public Wrapped snapshot'}
          </button>
          {href && (
            <p>
              <a href={href}>Open saved Wrapped snapshot</a>
              <input
                aria-label="Wrapped share link"
                readOnly
                value={new URL(href, window.location.origin).href}
              />
            </p>
          )}
          {error && <p role="alert">{error}</p>}
          {api.reportSharing && <ReportSharing api={api.reportSharing} leagueId={leagueId} />}
        </div>
      )}
    </details>
  );
}

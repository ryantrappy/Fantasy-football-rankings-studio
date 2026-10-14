import { Button } from '@chakra-ui/react';
import '../history-explorer.css';
import { useContext, useEffect, useRef, useState } from 'react';
import type { SeasonRecord } from '../../../league-summary';
import { ApiContext } from '../../../auth/session';
import { ReportSharing } from '../../ReportSharing';
import { buildWrapped, type WrappedRecap } from '../../../history/personalities/wrapped';
import { managerKey as identityKey } from '../../../history/personalities/common';
export function WrappedPreview({ recap }: { recap: WrappedRecap }) {
  return (
    <article
      aria-label="Wrapped share preview"
      className="history-explorer-wrapped-preview"
      style={{
        maxWidth: 720,
        width: '100%',
        boxSizing: 'border-box',
        overflowWrap: 'anywhere',
        padding: 'clamp(12px,4vw,28px)',
        borderRadius: 10,
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
          <p key={i} className="history-explorer-wrapped-highlight">
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
interface WrappedProps {
  records: SeasonRecord[];
  leagueId?: string;
  shared?: boolean;
  managerKey?: string;
  open?: boolean;
  seasonYear?: number;
  onSeasonChange?: (year: number) => void;
}

export function Wrapped(props: WrappedProps) {
  const [scope, setScope] = useState<'personal' | 'league'>('personal');
  return (
    <WrappedContent
      key={`${props.leagueId ?? ''}:${props.managerKey ?? 'local'}:${props.seasonYear ?? 'local'}`}
      {...props}
      scope={scope}
      onScopeChange={setScope}
    />
  );
}

function WrappedContent({
  records,
  leagueId,
  shared = false,
  managerKey,
  open,
  seasonYear,
  onSeasonChange,
  scope,
  onScopeChange,
}: WrappedProps & {
  scope: 'personal' | 'league';
  onScopeChange: (scope: 'personal' | 'league') => void;
}) {
  const api = useContext(ApiContext),
    [selectedYear, setYear] = useState(records[0]?.year),
    [localKey, setKey] = useState(''),
    [consent, setConsent] = useState(false),
    [href, setHref] = useState(''),
    [error, setError] = useState(''),
    [saving, setSaving] = useState(false);
  const requestGeneration = useRef(0);
  const record = records.find((r) => r.year === (seasonYear ?? selectedYear)) || records[0];
  useEffect(() => {
    return () => {
      requestGeneration.current += 1;
    };
  }, []);
  if (!record) return <p>Fantasy Wrapped unavailable. Load a season to build a recap.</p>;
  const key = scope === 'league' ? '' : (managerKey ?? localKey);
  const missingManager =
    !!key && !record.data.teams.some((team) => identityKey(record.year, team) === key);
  const recap = buildWrapped(record, key);
  function reset() {
    setConsent(false);
    setHref('');
    setError('');
  }
  return (
    <details open={open}>
      <summary>Personal and league Fantasy Wrapped</summary>
      <div className="history-explorer-toolbar">
        {managerKey !== undefined && (
          <label>
            Recap scope
            <select
              disabled={saving}
              value={scope}
              onChange={(event) => {
                onScopeChange(event.target.value as 'personal' | 'league');
                reset();
              }}
            >
              <option value="personal">Personal recap</option>
              <option value="league">League recap</option>
            </select>
          </label>
        )}
        <label>
          Wrapped season{' '}
          <select
            disabled={saving}
            value={record.year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              onSeasonChange?.(Number(e.target.value));
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
        {managerKey === undefined && (
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
                <option key={t.teamId} value={identityKey(record.year, t)}>
                  {t.managerName}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {missingManager ? (
        <p>This manager has no team in this season. Choose another season for their Wrapped.</p>
      ) : (
        <WrappedPreview recap={recap} />
      )}
      {!missingManager && !shared && leagueId && api?.createReportSnapshot && (
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
          <Button
            mt={4}
            type="button"
            disabled={!consent || saving}
            onClick={async () => {
              const generation = requestGeneration.current;
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
                if (generation === requestGeneration.current)
                  setHref(`/shared/snapshots/${result.publicId}`);
              } catch (e) {
                if (generation === requestGeneration.current)
                  setError(e instanceof Error ? e.message : 'Could not save snapshot.');
              } finally {
                if (generation === requestGeneration.current) setSaving(false);
              }
            }}
          >
            {saving ? 'Saving snapshot…' : 'Create public Wrapped snapshot'}
          </Button>
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

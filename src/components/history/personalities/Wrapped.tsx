import { RecordEvidence, RecordEvidenceLayout } from '../RecordEvidence';
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
      <div className="history-wrapped-story-grid" aria-label="Four season stories">
        {Array.from({ length: 4 }, (_, i) => {
          const text = recap.highlights[i];
          const separator = text?.indexOf(':') ?? -1;
          return (
            <div key={i} className="history-wrapped-story">
              <span>{separator > -1 ? text!.slice(0, separator) : 'Season evidence'}</span>
              <p>
                {separator > -1
                  ? text!.slice(separator + 1).trim()
                  : text || 'Unavailable: no additional supported highlight.'}
              </p>
            </div>
          );
        })}
      </div>
      {!recap.highlights.length && <p>No supported highlights yet.</p>}
      {recap.highlights.length > 4 && (
        <div className="history-wrapped-more">
          <h3>More from the season</h3>
          {recap.highlights.slice(4).map((text, i) => (
            <p key={i} className="history-explorer-wrapped-highlight">
              {text}
            </p>
          ))}
        </div>
      )}
      <details className="history-wrapped-coverage">
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
  const api = useContext(ApiContext);
  const [selectedYear, setYear] = useState(records[0]?.year);
  const [localKey, setKey] = useState('');
  const sourceVersion = records.map((source) => source.data.generatedAt).join(',');
  const emptyPublication = { consent: false, href: '', error: '', saving: false };
  const [publication, setPublication] = useState({ ...emptyPublication, version: sourceVersion });
  const { consent, href, error, saving } =
    publication.version === sourceVersion ? publication : emptyPublication;
  function updatePublication(update: Partial<typeof emptyPublication>) {
    setPublication((current) => ({
      ...(current.version === sourceVersion ? current : emptyPublication),
      ...update,
      version: sourceVersion,
    }));
  }
  const requestGeneration = useRef(0);
  const record = records.find((r) => r.year === (seasonYear ?? selectedYear)) || records[0];
  useEffect(() => {
    requestGeneration.current += 1;
  }, [sourceVersion]);
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
    updatePublication({ consent: false, href: '', error: '' });
  }
  return (
    <RecordEvidenceLayout
      evidence={
        <RecordEvidence
          records={[record]}
          scope={`${record.year}:${key}:${scope}`}
          entries={
            missingManager
              ? []
              : recap.highlights.map((text, index) => ({
                  id: text,
                  year: record.year,
                  title: text.includes(':')
                    ? text.slice(0, text.indexOf(':'))
                    : `Season highlight ${index + 1}`,
                  detail: (
                    <>
                      <p>{text}</p>
                      <p>{recap.coverage[0]}</p>
                    </>
                  ),
                }))
          }
          empty={
            missingManager
              ? 'No personal recap evidence: this manager is absent from the selected season.'
              : 'No supported recap highlights are available.'
          }
        />
      }
    >
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
          <div className="history-wrapped-publishing">
            <h3>Publish this recap</h3>
            <p>
              Only the preview's cards are published. Raw history, other managers' profiles and
              provider account IDs are excluded. Snapshot expires in 10 days. Disable public report
              sharing below to revoke existing links.
            </p>
            <label className="history-wrapped-consent">
              <input
                type="checkbox"
                disabled={saving}
                checked={consent}
                onChange={(e) => updatePublication({ consent: e.target.checked })}
              />{' '}
              Publish this preview to anyone with its link
            </label>
            <Button
              mt={4}
              type="button"
              disabled={!consent || saving}
              onClick={async () => {
                const generation = requestGeneration.current;
                updatePublication({ saving: true, error: '' });
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
                    updatePublication({ href: `/shared/snapshots/${result.publicId}` });
                } catch (e) {
                  if (generation === requestGeneration.current)
                    updatePublication({
                      error: e instanceof Error ? e.message : 'Could not save snapshot.',
                    });
                } finally {
                  if (generation === requestGeneration.current)
                    updatePublication({ saving: false });
                }
              }}
            >
              {saving ? 'Saving snapshot…' : 'Create public Wrapped snapshot'}
            </Button>
            {href && (
              <p>
                Saved snapshot: this link keeps the exact preview you published. A changed recap
                requires a new snapshot.
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
    </RecordEvidenceLayout>
  );
}

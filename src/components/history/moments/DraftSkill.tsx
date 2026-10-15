import { RecordEvidence, RecordEvidenceLayout } from '../RecordEvidence';
import type { SeasonRecord } from '../../../league-summary';
import { draftSkill, draftValues } from '../../../history/moments/draft';
export function DraftSkill({
  record,
  records,
  manager,
  open,
}: {
  record: SeasonRecord;
  records: SeasonRecord[];
  manager: string;
  open?: boolean;
}) {
  const { data } = record;
  const rows = draftValues(data)
    .filter((p) => !manager || p.teamId === manager)
    .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
  const key =
    manager &&
    (data.teams.find((t) => t.teamId === manager)?.managerKey || `${record.year}:${manager}`);
  return (
    <RecordEvidenceLayout
      evidence={
        <RecordEvidence
          records={records}
          scope={`${record.year}:${manager}`}
          entries={rows.map((row) => ({
            id: `${row.overallPick}:${row.playerId}`,
            year: record.year,
            title: `${data.playerIdentities?.[row.playerId]?.name || row.playerId} · pick ${row.overallPick}`,
            detail: (
              <>
                <p>
                  Observed production {row.points?.toFixed(1) ?? 'unavailable'}; local pick baseline{' '}
                  {row.baseline?.toFixed(1) ?? 'unavailable'}; value{' '}
                  {row.value?.toFixed(1) ?? 'unranked'}.
                </p>
                <p>
                  {row.weeks} required weeks and {row.cohort} fully observed peers.{' '}
                  {data.draftCoverage || 'Historical draft coverage unavailable.'}
                </p>
              </>
            ),
          }))}
          empty="Draft evidence unavailable for this manager and season. Missing production and unsupported formats remain unranked."
        />
      }
    >
      <details open={open}>
        <summary>Draft value and drafting skill</summary>
        <p>
          {data.draftCoverage || 'Historical draft data unavailable.'} Format:{' '}
          {data.draftFormat || 'unknown'}. Baseline: mean season points of other picks within ±
          {data.teams.length} overall selections, at least two fully observed peers. Every
          configured completed week must have an observed league-scored player value; missing weeks
          never become zero. Auction and unknown formats remain unranked.
        </p>
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table>
            <caption>Best to worst observed draft values — {record.year}</caption>
            <thead>
              <tr>
                <th>Manager / pick</th>
                <th>Player</th>
                <th>Production</th>
                <th>Expected</th>
                <th>Value</th>
                <th>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={`${p.overallPick}:${p.playerId}`}>
                  <td>
                    {data.teams.find((t) => t.teamId === p.teamId)?.managerName || p.teamId} /{' '}
                    {p.overallPick}
                  </td>
                  <td>{data.playerIdentities?.[p.playerId]?.name || p.playerId}</td>
                  <td>{p.points?.toFixed(1) ?? 'Unavailable'}</td>
                  <td>{p.baseline?.toFixed(1) ?? 'Unavailable'}</td>
                  <td>{p.value?.toFixed(1) ?? 'Unranked'}</td>
                  <td>
                    {p.weeks} required weeks; {p.cohort} observed peers
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table>
            <caption>Multi-season skill — relative value above local pick baseline</caption>
            <thead>
              <tr>
                <th>Manager</th>
                <th>Format</th>
                <th>Mean relative value</th>
                <th>Sample</th>
              </tr>
            </thead>
            <tbody>
              {draftSkill(records)
                .filter((r) => !manager || r.identity === key)
                .map((r, i) => (
                  <tr key={i}>
                    <td>{r.manager}</td>
                    <td>{r.format}</td>
                    <td>{(r.relativeValue * 100).toFixed(1)}%</td>
                    <td>
                      {r.picks} comparable picks / {r.seasons} seasons
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </RecordEvidenceLayout>
  );
}

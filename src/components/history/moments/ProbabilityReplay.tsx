import { RecordEvidence, RecordEvidenceLayout } from '../RecordEvidence';
import { useState } from 'react';
import type { SeasonInsights } from '../../../insights';
export function ProbabilityReplay({
  data,
  year,
  manager,
  open,
}: {
  data: SeasonInsights;
  year?: number;
  manager: string;
  open?: boolean;
}) {
  const [selected, setSelected] = useState('');
  const archives = (data.matchupArchive || []).filter((a) => !manager || a.teamId === manager);
  const key = (a: (typeof archives)[number]) => `${a.week}:${a.teamId}:${a.opponentTeamId}`;
  const archive = archives.find((a) => key(a) === selected) || archives[0];
  const name = (id: string) => data.teams.find((t) => t.teamId === id)?.managerName || id;
  const chooser = archives.length ? (
    <label>
      Replay matchup{' '}
      <select value={archive ? key(archive) : ''} onChange={(e) => setSelected(e.target.value)}>
        {archives.map((a) => (
          <option key={key(a)} value={key(a)}>
            Week {a.week}: {name(a.teamId)} vs {name(a.opponentTeamId)}
          </option>
        ))}
      </select>
    </label>
  ) : null;
  const evidence = (
    <RecordEvidence
      records={year === undefined ? [] : [{ year, data }]}
      scope={`${year}:${manager}:${archive ? key(archive) : ''}`}
      entries={
        archive
          ? archive.snapshots.map((snapshot) => ({
              id: snapshot.capturedAt,
              year,
              title: snapshot.capturedAt,
              detail: (
                <>
                  <p>
                    {(snapshot.probability * 100).toFixed(1)}% observed win probability. Source:{' '}
                    {archive.source}.
                  </p>
                  <p>
                    {snapshot.contributors
                      .map(
                        (player) =>
                          `${data.playerIdentities?.[player.playerId]?.name || player.playerId}: ${player.points} points`,
                      )
                      .join('; ') || 'Contributing events unavailable; cause unknown.'}
                  </p>
                  <p>
                    Archive provenance is supplied by its author. Gaps between checkpoints remain
                    unknown.
                  </p>
                </>
              ),
            }))
          : []
      }
      empty="Replay evidence unavailable. At least two game-time checkpoints are required; final scores cannot reconstruct a timeline."
    />
  );
  if (!archive || archive.snapshots.length < 2)
    return (
      <RecordEvidenceLayout evidence={evidence}>
        <details open={open ?? true}>
          <summary>Matchup probability replay</summary>
          {chooser}
          <p>
            Replay unavailable: at least two archived game-time checkpoints are required. Final
            scores and weekly projections cannot reconstruct this timeline.
          </p>
        </details>
      </RecordEvidenceLayout>
    );
  const start = Date.parse(archive.snapshots[0].capturedAt);
  const duration = Date.parse(archive.snapshots.at(-1)!.capturedAt) - start;
  const x = (time: string) => 40 + ((Date.parse(time) - start) / duration) * 520;
  const y = (p: number) => 220 - p * 200;
  return (
    <RecordEvidenceLayout evidence={evidence}>
      <details open={open ?? true}>
        <summary>Matchup probability replay</summary>
        {chooser}
        <p>
          Source: {archive.source}. {archive.snapshots.length} observed checkpoints,{' '}
          {archive.snapshots[0].capturedAt} through {archive.snapshots.at(-1)!.capturedAt}. Gaps are
          unknown; lines connect observations without estimating missing probabilities.
        </p>
        <svg
          viewBox="0 0 600 260"
          // SVG provides the plotted geometry while its image role exposes the title to assistive tools.
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
          role="img"
          aria-label={`Observed win probability for ${name(archive.teamId)}`}
          style={{ width: '100%', maxWidth: 800 }}
        >
          <title>Observed matchup win probability</title>
          <desc>
            Time runs left to right. Probability ranges from zero to one hundred percent. Exact
            times, probabilities and supplied scoring events appear in the table below.
          </desc>
          <path d="M40 20 V220 H560" fill="none" stroke="currentColor" />
          <text x="0" y="25">
            100%
          </text>
          <text x="10" y="220">
            0%
          </text>
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            points={archive.snapshots
              .map((s) => `${x(s.capturedAt)},${y(s.probability)}`)
              .join(' ')}
          />
          {archive.snapshots.map((s) => (
            <circle
              key={s.capturedAt}
              cx={x(s.capturedAt)}
              cy={y(s.probability)}
              r="4"
              fill="currentColor"
            >
              <title>
                {s.capturedAt}: {(s.probability * 100).toFixed(1)}%
              </title>
            </circle>
          ))}
          <text x="40" y="245">
            First checkpoint
          </text>
          <text x="440" y="245">
            Last checkpoint
          </text>
        </svg>
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table>
            <caption>Observed probability and scoring events</caption>
            <thead>
              <tr>
                <th>Time (UTC)</th>
                <th>Win probability</th>
                <th>Change</th>
                <th>Supplied contributing events</th>
              </tr>
            </thead>
            <tbody>
              {archive.snapshots.map((s, i) => {
                const change = i
                  ? (s.probability - archive.snapshots[i - 1].probability) * 100
                  : null;
                return (
                  <tr key={s.capturedAt}>
                    <td>
                      {s.capturedAt}
                      {s.capturedAt === archive.preMondayAt ? ' (pre-Monday)' : ''}
                    </td>
                    <td>{(s.probability * 100).toFixed(1)}%</td>
                    <td>
                      {change === null
                        ? 'First checkpoint'
                        : `${change.toFixed(1)} percentage points${Math.abs(change) >= 20 ? ' — major swing' : ''}`}
                    </td>
                    <td>
                      {s.contributors
                        .map(
                          (p) =>
                            `${data.playerIdentities?.[p.playerId]?.name || p.playerId}: ${p.points} points`,
                        )
                        .join('; ') || 'Events unavailable; cause unknown'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </RecordEvidenceLayout>
  );
}

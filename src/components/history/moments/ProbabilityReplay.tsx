import { useState } from 'react';
import type { SeasonInsights } from '../../../insights';
export function ProbabilityReplay({ data, manager }: { data: SeasonInsights; manager: string }) {
  const [selected, setSelected] = useState('');
  const archives = (data.matchupArchive || []).filter((a) => !manager || a.teamId === manager);
  const key = (a: (typeof archives)[number]) => `${a.week}:${a.teamId}:${a.opponentTeamId}`;
  const archive = archives.find((a) => key(a) === selected) || archives[0];
  const name = (id: string) => data.teams.find((t) => t.teamId === id)?.managerName || id;
  if (!archive || archive.snapshots.length < 2)
    return (
      <details open>
        <summary>Matchup probability replay</summary>
        <p>
          Replay unavailable: at least two archived game-time checkpoints are required. Final scores
          and weekly projections cannot reconstruct this timeline.
        </p>
      </details>
    );
  const start = Date.parse(archive.snapshots[0].capturedAt);
  const duration = Date.parse(archive.snapshots.at(-1)!.capturedAt) - start;
  const x = (time: string) => 40 + ((Date.parse(time) - start) / duration) * 520;
  const y = (p: number) => 220 - p * 200;
  return (
    <details open>
      <summary>Matchup probability replay</summary>
      <label>
        Replay matchup{' '}
        <select value={key(archive)} onChange={(e) => setSelected(e.target.value)}>
          {archives.map((a) => (
            <option key={key(a)} value={key(a)}>
              Week {a.week}: {name(a.teamId)} vs {name(a.opponentTeamId)}
            </option>
          ))}
        </select>
      </label>
      <p>
        Source: {archive.source}. {archive.snapshots.length} observed checkpoints,{' '}
        {archive.snapshots[0].capturedAt} through {archive.snapshots.at(-1)!.capturedAt}. Gaps are
        unknown; lines connect observations without estimating missing probabilities.
      </p>
      <svg
        viewBox="0 0 600 260"
        role="img"
        aria-label={`Observed win probability for ${name(archive.teamId)}`}
        style={{ width: '100%', maxWidth: 800 }}
      >
        <title>Observed matchup win probability</title>
        <desc>
          Time runs left to right. Probability ranges from zero to one hundred percent. Exact times,
          probabilities and supplied scoring events appear in the table below.
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
          points={archive.snapshots.map((s) => `${x(s.capturedAt)},${y(s.probability)}`).join(' ')}
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
            const change = i ? (s.probability - archive.snapshots[i - 1].probability) * 100 : null;
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
    </details>
  );
}

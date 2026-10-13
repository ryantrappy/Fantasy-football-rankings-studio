import type { SeasonInsights } from '../../../insights';
import { tradeContributions } from '../../../history/moments/contributions';
export function TradeContributions({ data, manager }: { data: SeasonInsights; manager: string }) {
  const rows = tradeContributions(data).filter((r) => !manager || r.move.to === manager);
  return (
    <details>
      <summary>Extended trade contribution</summary>
      <p>
        Observed league-scored roster points and actual starting points are separate. Evaluation
        starts after the trade week and ends before the next observed asset movement or at the
        completed cutoff. Verified postseason matchup weeks establish playoff contribution.
        Recipient season results do not establish whether this asset remained on the championship
        roster; points never imply a title was caused by the trade. No winner is forced: context,
        picks, future seasons and unobserved ownership remain unvalued.
      </p>
      <p>
        {data.moveCoverage?.note || 'Transaction coverage unavailable.'} Missing transactions may
        hide ownership interruptions; only recorded team roster/start observations receive credit.
      </p>
      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <table>
          <caption>Acquired assets — season-long observed contribution</caption>
          <thead>
            <tr>
              <th>Trade / recipient / player</th>
              <th>Window</th>
              <th>Observed roster points</th>
              <th>Actual starts / points</th>
              <th>Verified playoff starts / points</th>
              <th>Recipient season result</th>
              <th>Coverage / verdict</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>
                  {r.move.id} /{' '}
                  {data.teams.find((t) => t.teamId === r.move.to)?.managerName || r.move.to} /{' '}
                  {data.playerIdentities?.[r.move.playerId]?.name || r.move.playerId}
                </td>
                <td>
                  {r.weeks.length
                    ? `Weeks ${r.weeks[0]}–${r.weeks.at(-1)}`
                    : 'No completed post-trade weeks'}
                  ; {r.cutoff}
                </td>
                <td>{r.observedPoints?.toFixed(1) ?? 'Unavailable'}</td>
                <td>
                  {r.starts ?? 'Unavailable'} / {r.startingPoints?.toFixed(1) ?? 'Unavailable'}
                </td>
                <td>
                  {r.playoffKnown
                    ? `${r.playoffStarts ?? 'Unavailable'} / ${r.playoffPoints?.toFixed(1) ?? 'Unavailable'}`
                    : 'Unavailable: verified playoff games missing'}
                </td>
                <td>
                  {r.champion === true
                    ? 'Recipient later champion; asset championship role unverified'
                    : r.champion === false
                      ? 'Recipient documented non-champion'
                      : 'Unknown'}
                </td>
                <td>
                  {r.observedWeeks}/{r.weeks.length} observed player weeks; {r.lineupWeeks}/
                  {r.weeks.length} complete lineups. Unranked: context-dependent; picks/future value
                  excluded.
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

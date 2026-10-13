import type { SeasonRecord } from '../../../league-summary';
import { tradeNetwork, tradeTrees } from '../../../history/moments/trades';
const anchor = (year: number, id: string) => `trade-${year}-${encodeURIComponent(id)}`;
export function TradeNetwork({
  record,
  records,
  manager,
}: {
  record: SeasonRecord;
  records: SeasonRecord[];
  manager: string;
}) {
  const { data, year } = record;
  const identity =
    manager && (data.teams.find((t) => t.teamId === manager)?.managerKey || `${year}:${manager}`);
  const name = (id: string | null) =>
    data.teams.find((t) => t.teamId === id)?.managerName || id || 'Unknown';
  const trees = tradeTrees(record).filter(
    (t) => !manager || t.move.from === manager || t.move.to === manager,
  );
  return (
    <details>
      <summary>Trade network and asset trees</summary>
      <p>
        Counts are distinct observed transactions between manager pairs. Stable provider identity
        joins seasons; missing manager identity stays season-specific. Player continuity is
        confirmed only with complete intervening transaction coverage. Draft picks, unresolved
        assets and future value are unvalued.
      </p>
      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <table>
          <caption>Manager trade partners across selected seasons</caption>
          <thead>
            <tr>
              <th>Pair</th>
              <th>Trades</th>
              <th>Transactions</th>
            </tr>
          </thead>
          <tbody>
            {tradeNetwork(records)
              .filter((p) => !manager || p.identities.includes(identity as string))
              .map((p, i) => (
                <tr key={i}>
                  <td>
                    {p.a} ↔ {p.b}
                  </td>
                  <td>{p.transactions.length}</td>
                  <td>
                    {p.transactions.map((t) => (
                      <a key={`${t.year}:${t.id}`} href={`#${anchor(t.year, t.id)}`}>
                        {t.year}: {t.id}{' '}
                      </a>
                    ))}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <h4>Selected season asset trail</h4>
      <p>
        {data.moveCoverage?.note || 'Transaction coverage unknown.'} Cross-season asset continuity
        is unavailable without an archived season-boundary ownership record.
      </p>
      <ul>
        {trees.map((t, i) => (
          <li key={i}>
            {data.playerIdentities?.[t.move.playerId]?.name || t.move.playerId}: {name(t.move.from)}{' '}
            → {name(t.move.to)}, W{t.move.week}, transaction{' '}
            <a href={`#${anchor(year, t.move.id)}`}>{t.move.id}</a>
            {t.next ? (
              <>
                {' '}
                → W{t.next.week} {t.next.type} {name(t.next.from)} → {name(t.next.to)} ({t.next.id})
              </>
            ) : null}
            . {t.reason}
          </li>
        ))}
      </ul>
      <h4>Underlying transactions (all selected seasons)</h4>
      {records.map((r) => (
        <ul key={r.year}>
          {[
            ...new Set([
              ...(r.data.moves || [])
                .filter((m) => m.type === 'trade' && m.week <= r.data.completedWeek)
                .map((m) => m.id),
              ...(r.data.draftPickTradeIds || []),
            ]),
          ].map((id) => (
            <li id={anchor(r.year, id)} key={id}>
              {r.year} / {id}:{' '}
              {(r.data.moves || [])
                .filter((m) => m.type === 'trade' && m.week <= r.data.completedWeek && m.id === id)
                .map(
                  (m) =>
                    `${r.data.playerIdentities?.[m.playerId]?.name || m.playerId}: ${m.from || '?'} → ${m.to || '?'}`,
                )
                .join('; ') || 'Player assets/participants unavailable'}
              {r.data.draftPickTradeIds?.includes(id)
                ? ' — includes draft picks: unresolved value and pick lineage'
                : ''}
            </li>
          ))}
        </ul>
      ))}
    </details>
  );
}

import { useState } from 'react';
import type { SeasonRecord } from '../../../league-summary';
import { transactionActivity } from '../../../history/personalities/activity';
export function PersonalitiesHistory({
  records,
  years,
}: {
  records: SeasonRecord[];
  years: number[];
  leagueId?: string;
  shared?: boolean;
}) {
  const [labels, setLabels] = useState(false);
  return (
    <section className="panel insight-section" aria-label="Manager personalities">
      <h2>Transaction activity</h2>
      <p>
        {records.length} of {years.length} selected seasons loaded. Waiver claims are unsupported
        when providers do not distinguish them from free-agent pickups.
      </p>
      <label>
        <input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)} />{' '}
        Show playful activity labels
      </label>
      {labels && (
        <p>
          Tinkerer: at least two pickups plus drops per covered week. Steady hand: fewer than two.
          Requires complete coverage and at least four weeks.
        </p>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table>
          <caption>Transactions per manager and season</caption>
          <thead>
            <tr>
              <th>Season</th>
              <th>Manager</th>
              <th>Pickups</th>
              <th>Drops</th>
              <th>Trades</th>
              <th>Coverage</th>
              {labels && <th>Activity</th>}
            </tr>
          </thead>
          <tbody>
            {transactionActivity(records).map((row) => (
              <tr key={`${row.year}:${row.key}`}>
                <td>{row.year}</td>
                <th scope="row">{row.manager}</th>
                <td>{row.pickups ?? 'Unsupported'}</td>
                <td>{row.drops ?? 'Unsupported'}</td>
                <td>{row.trades ?? 'Unsupported'}</td>
                <td>{row.coverage}</td>
                {labels && <td>{row.label || 'Insufficient evidence'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

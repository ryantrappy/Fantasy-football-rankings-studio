import { useState } from 'react';
import type { SeasonRecord } from '../../../league-summary';
import { playerLoyalty } from '../../../history/personalities/loyalty';
export function PlayerLoyalty({
  records,
  managerKey,
  open,
}: {
  records: SeasonRecord[];
  managerKey?: string;
  open?: boolean;
}) {
  const rows = playerLoyalty(records),
    [localManager, setManager] = useState('');
  const manager = managerKey ?? localManager;
  const selected = rows.filter((r) => !manager || r.key === manager),
    favorites = new Map<string, string>();
  for (const row of selected) if (!favorites.has(row.key)) favorites.set(row.key, row.playerId);
  return (
    <details open={open}>
      <summary>Player loyalty and ownership</summary>
      <p>
        Observed league ownership only, not complete NFL career history. Favorites rank by observed
        roster weeks, then seasons, then drafts. Acquisition counts are known events, never proof of
        complete history. Player IDs stay separate across provider changes.
      </p>
      {managerKey === undefined && (
        <label>
          Ownership manager{' '}
          <select value={manager} onChange={(e) => setManager(e.target.value)}>
            <option value="">All managers</option>
            {[...new Map(rows.map((r) => [r.key, r.manager])).entries()].map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table>
          <caption>Manager-player ownership</caption>
          <thead>
            <tr>
              <th>Manager</th>
              <th>Player</th>
              <th>Observed seasons</th>
              <th>Roster weeks</th>
              <th>Draft / trade / pickup</th>
              <th>Favorite evidence</th>
            </tr>
          </thead>
          <tbody>
            {selected.map((r) => (
              <tr key={`${r.key}:${r.playerId}`}>
                <th>{r.manager}</th>
                <td>
                  {r.player} ({r.playerId})
                </td>
                <td>{r.seasons.join(', ')}</td>
                <td>{r.weeks}</td>
                <td>
                  {r.drafts} / {r.trades} / {r.pickups}
                </td>
                <td>
                  {favorites.get(r.key) === r.playerId
                    ? `${r.weeks ? 'Best-supported favorite' : 'Acquisition-only candidate'}: ${r.weeks} observed weeks, ${r.seasons.length} seasons`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!selected.length && <p>No observed ownership or acquisition records.</p>}
    </details>
  );
}

import { useMemo } from 'react';
import { DataTable } from './DataTable';
import type { League, WeeklyRanking } from '../types';
import { previousPosition } from '../util/rankings';
import type { ExportTheme } from '../hooks/useExportTheme';

export function RankingPreview({
  ranking,
  history,
  league,
  theme = 'classic',
}: {
  ranking: WeeklyRanking;
  history: WeeklyRanking[];
  league: League;
  theme?: ExportTheme;
}) {
  const rows = useMemo(
    () =>
      ranking.teams.map((team, index) => {
        const previous = previousPosition(history, ranking, team.teamId);
        return {
          ...team,
          rank: index + 1,
          previous,
          delta: previous === undefined ? undefined : previous - index - 1,
        };
      }),
    [ranking, history],
  );
  return (
    <div
      className={`ranking-preview${theme === 'new' ? ' new-export-theme' : ''}`}
      aria-label={`${league.leagueName} week ${ranking.week} rankings`}
    >
      <h2 className="export-title">{ranking.rankingsTitle || `Week ${ranking.week}`}</h2>
      {ranking.introduction && <p className="export-introduction">{ranking.introduction}</p>}
      <DataTable
        label="Weekly rankings"
        className="export-table"
        data={rows}
        getRowId={(team) => team.teamId}
        initialSorting={[{ id: 'export-rank', desc: false }]}
        columns={[
          {
            id: 'export-rank',
            header: 'Rank',
            className: 'export-rank',
            value: (team) => team.rank,
            cell: (team) => (
              <>
                <span
                  className={`export-rank-circle ${team.rank - 1 < Math.ceil(ranking.teams.length / 2) ? 'top-half' : 'bottom-half'}`}
                >
                  {team.rank}
                </span>
              </>
            ),
          },
          {
            id: 'export-team',
            header: 'Team / Record',
            className: 'export-team',
            value: (team) => team.teamName,
            cell: (team) => (
              <>
                <div className="export-team-name">{team.teamName}</div>
                <div className="export-team-details">
                  <span>{team.managerName}</span>
                  <span>
                    {team.wins}-{team.loss}
                    {team.ties ? `-${team.ties}` : ''}
                  </span>
                </div>
              </>
            ),
          },
          {
            id: 'export-trend',
            header: 'Trending',
            className: 'export-trend',
            value: (team) => team.delta,
            cell: (team) => (
              <>
                <div
                  className={`export-movement ${team.delta && team.delta > 0 ? 'up' : team.delta && team.delta < 0 ? 'down' : ''}`}
                  aria-label={
                    team.delta === undefined
                      ? 'No previous week'
                      : team.delta === 0
                        ? 'No change'
                        : `${Math.abs(team.delta)} ${team.delta > 0 ? 'up' : 'down'}`
                  }
                >
                  {team.delta === undefined
                    ? 'NEW'
                    : team.delta === 0
                      ? '---'
                      : `${team.delta > 0 ? '▲' : '▼'} ${Math.abs(team.delta)}`}
                </div>
                <div className="export-last-week">Last Week: {team.previous ?? '—'}</div>
              </>
            ),
          },
          {
            id: 'export-comments',
            header: 'Comments',
            value: (team) => team.description,
            className: 'export-comments',
            cell: (team) => <>{team.description}</>,
          },
        ]}
      >
        <colgroup>
          <col className="export-rank-column" />
          <col className="export-team-column" />
          <col className="export-trend-column" />
          <col className="export-comments-column" />
        </colgroup>
      </DataTable>
    </div>
  );
}

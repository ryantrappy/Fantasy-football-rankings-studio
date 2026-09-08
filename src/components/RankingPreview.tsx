import type { League, WeeklyRanking } from '../types';
import { previousPosition } from '../util/rankings';

export function RankingPreview({
  ranking,
  history,
  league,
}: {
  ranking: WeeklyRanking;
  history: WeeklyRanking[];
  league: League;
}) {
  return (
    <div
      className="ranking-preview"
      aria-label={`${league.leagueName} week ${ranking.week} rankings`}
    >
      <h2 className="export-title">{ranking.rankingsTitle || `Week ${ranking.week}`}</h2>
      {ranking.introduction && <p className="export-introduction">{ranking.introduction}</p>}
      <table className="export-table">
        <colgroup>
          <col className="export-rank-column" />
          <col className="export-team-column" />
          <col className="export-trend-column" />
          <col className="export-comments-column" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">Team / Record</th>
            <th scope="col">Trending</th>
            <th scope="col">Comments</th>
          </tr>
        </thead>
        <tbody>
          {ranking.teams.map((team, index) => {
            const previous = previousPosition(history, ranking, team.teamId);
            const delta = previous === undefined ? undefined : previous - index - 1;
            return (
              <tr key={team.teamId}>
                <td className="export-rank">
                  <span
                    className={`export-rank-circle ${index < Math.ceil(ranking.teams.length / 2) ? 'top-half' : 'bottom-half'}`}
                  >
                    {index + 1}
                  </span>
                </td>
                <td className="export-team">
                  <div className="export-team-name">{team.teamName}</div>
                  <div className="export-team-details">
                    <span>{team.managerName}</span>
                    <span>
                      {team.wins}-{team.loss}
                      {team.ties ? `-${team.ties}` : ''}
                    </span>
                  </div>
                </td>
                <td className="export-trend">
                  <div
                    className={`export-movement ${delta && delta > 0 ? 'up' : delta && delta < 0 ? 'down' : ''}`}
                    aria-label={
                      delta === undefined
                        ? 'No previous week'
                        : delta === 0
                          ? 'No change'
                          : `${Math.abs(delta)} ${delta > 0 ? 'up' : 'down'}`
                    }
                  >
                    {delta === undefined
                      ? 'NEW'
                      : delta === 0
                        ? '---'
                        : `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)}`}
                  </div>
                  <div className="export-last-week">Last Week: {previous ?? '—'}</div>
                </td>
                <td className="export-comments">{team.description}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

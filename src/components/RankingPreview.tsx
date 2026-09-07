import type { League, WeeklyRanking } from '../types';
import { previousPosition } from '../util/rankings';

export function RankingPreview({ ranking, history, league }: { ranking: WeeklyRanking; history: WeeklyRanking[]; league: League }) {
  return <div className="ranking-preview">
    <div className="preview-masthead"><span>THE POWER RANKINGS</span><span>{ranking.year} / WK {String(ranking.week).padStart(2, '0')}</span></div>
    <div className="preview-heading"><span className="eyebrow">{league.leagueName}</span><h2>{ranking.rankingsTitle || 'Power rankings'}</h2>{ranking.introduction && <p>{ranking.introduction}</p>}</div>
    <div className="preview-columns"><span>Rank / Team</span><span>Movement</span></div>
    <ol className="preview-list">{ranking.teams.map((team, index) => {
      const previous = previousPosition(history, ranking, team.teamId);
      const delta = previous === undefined ? undefined : previous - index - 1;
      return <li key={team.teamId}><div className="preview-team"><span className="preview-position">{String(index + 1).padStart(2, '0')}</span><div><strong>{team.teamName}</strong><small>{team.managerName} · {team.wins}–{team.loss}{team.ties ? `–${team.ties}` : ''}</small></div><span className={`movement ${delta > 0 ? 'positive' : delta < 0 ? 'negative' : ''}`} aria-label={delta === undefined ? 'No previous week' : delta === 0 ? 'No change' : `${Math.abs(delta)} ${delta > 0 ? 'up' : 'down'}`}>{delta === undefined ? 'NEW' : delta === 0 ? '—' : `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta)}`}</span></div>{team.description && <p>{team.description}</p>}</li>;
    })}</ol>
    <div className="preview-footer"><span>Made for the league. Built for the debate.</span><strong>POWER / RANK</strong></div>
  </div>;
}

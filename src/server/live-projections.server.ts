import '@tanstack/react-start/server-only';
import axios from 'axios';

type Game = {
  status?: { clock?: number; period?: number; type?: { state?: string; completed?: boolean } };
  competitions?: { competitors?: { team?: { id?: string; abbreviation?: string } }[] }[];
};
export function gameRemaining(game: Game): number | undefined {
  const status = game.status;
  if (status?.type?.completed || status?.type?.state === 'post') return 0;
  if (status?.type?.state === 'pre') return 1;
  if (status?.type?.state !== 'in' || !status.period || status.clock == null) return undefined;
  // Overtime remains uncertain until the game is marked complete.
  if (status.period > 4) return Math.max(0.01, Math.min(1, status.clock / 3600));
  return Math.max(0.01, Math.min(1, ((4 - status.period) * 900 + status.clock) / 3600));
}
const gamesCache = new Map<string, { expires: number; value: Promise<Map<string, number>> }>();
export function nflRemaining(year: number, week: number) {
  const key = `${year}:${week}`;
  const cached = gamesCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;
  const value = axios
    .get<{ events?: Game[] }>(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
      { params: { dates: year, seasontype: 2, week, limit: 100 }, timeout: 10000 },
    )
    .then(({ data }) => {
      if (!data.events?.length) throw new Error('NFL schedule unavailable');
      const remaining = new Map<string, number>();
      for (const game of data.events) {
        const fraction = gameRemaining(game);

        for (const competitor of game.competitions?.[0]?.competitors || []) {
          const team = competitor.team;
          if (team?.id) remaining.set(team.id, fraction ?? Number.NaN);
          if (team?.abbreviation) {
            const abbreviation =
              ({ WSH: 'WAS', JAX: 'JAC' } as Record<string, string>)[team.abbreviation] ||
              team.abbreviation;
            remaining.set(abbreviation, fraction ?? Number.NaN);
          }
        }
      }
      return remaining;
    })
    .catch((error) => {
      gamesCache.delete(key);
      throw error;
    });
  gamesCache.set(key, { expires: Date.now() + 45_000, value });
  return value;
}

type Projection = { player_id?: string; stats?: Record<string, number>; capturedAt?: string };
const projectionsCache = new Map<string, { expires: number; value: Promise<Projection[]> }>();
export function sleeperLiveProjections(year: number, week: number) {
  const key = `${year}:${week}`;
  const cached = projectionsCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;
  const value = axios
    .get<Projection[]>(`https://api.sleeper.app/projections/nfl/${year}/${week}`, {
      params: {
        season_type: 'regular',
        'position[]': ['FLEX', 'K', 'QB', 'RB', 'TE', 'WR', 'DEF', 'DL', 'LB', 'DB'],
      },
      timeout: 10000,
    })
    .then(({ data }) => {
      if (!Array.isArray(data)) throw new Error('Invalid Sleeper projection response');
      const capturedAt = new Date().toISOString();
      return data.map((row) => ({ ...row, capturedAt }));
    })
    .catch((error) => {
      projectionsCache.delete(key);
      throw error;
    });
  projectionsCache.set(key, { expires: Date.now() + 300_000, value });
  return value;
}

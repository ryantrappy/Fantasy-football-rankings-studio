import '@tanstack/react-start/server-only';
import axios from 'axios';
import type { NflSchedule } from '../live-matchups';

type NflTeam = { id?: string; abbreviation?: string };
type Game = {
  date?: string;
  status?: {
    clock?: number;
    period?: number;
    type?: { name?: string; detail?: string; state?: string; completed?: boolean };
  };
  competitions?: { date?: string; timeValid?: boolean; competitors?: { team?: NflTeam }[] }[];
};
const teamKeys = (team: NflTeam) => [
  ...(team.id ? [team.id] : []),
  ...(team.abbreviation
    ? [
        ({ WSH: 'WAS', JAX: 'JAC' } as Record<string, string>)[team.abbreviation] ||
          team.abbreviation,
      ]
    : []),
];
export function gameSchedule(game: Game, capturedAt: string): NflSchedule {
  const type = game.status?.type;
  const label = `${type?.name ?? ''} ${type?.detail ?? ''}`;
  const status = /postpon/i.test(label)
    ? 'postponed'
    : /cancel/i.test(label)
      ? 'canceled'
      : /resched/i.test(label)
        ? 'rescheduled'
        : type?.state === 'pre'
          ? 'scheduled'
          : type?.state === 'in'
            ? 'in-progress'
            : type?.completed || type?.state === 'post'
              ? 'final'
              : 'unavailable';
  const date = game.competitions?.[0]?.date ?? game.date;
  // ESPN supplies placeholder dates for games whose kickoff has not been determined.
  const kickoffAt =
    ['scheduled', 'rescheduled'].includes(status) &&
    game.competitions?.[0]?.timeValid === true &&
    date &&
    /T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(date) &&
    Number.isFinite(Date.parse(date))
      ? new Date(date).toISOString()
      : undefined;
  return { status, kickoffAt, source: 'ESPN NFL scoreboard', capturedAt };
}
export function gameRemaining(game: Game): number | undefined {
  const status = game.status;
  if (status?.type?.completed || status?.type?.state === 'post') return 0;
  if (status?.type?.state === 'pre') return 1;
  if (status?.type?.state !== 'in' || !status.period || status.clock == null) return undefined;
  // Overtime remains uncertain until the game is marked complete.
  if (status.period > 4) return Math.max(0.01, Math.min(1, status.clock / 3600));
  return Math.max(0.01, Math.min(1, ((4 - status.period) * 900 + status.clock) / 3600));
}
type Scoreboard = { remaining: Map<string, number>; schedule: Map<string, NflSchedule> };
const gamesCache = new Map<string, { expires: number; value: Promise<Scoreboard> }>();
// Keep successful observations independently of the short-lived response cache.
const scheduleHistory = new Map<string, Map<string, NflSchedule>>();
function nflScoreboard(year: number, week: number) {
  const key = `${year}:${week}`;
  const cached = gamesCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;
  for (const [id, entry] of gamesCache) if (entry.expires <= Date.now()) gamesCache.delete(id);
  if (gamesCache.size >= 36) gamesCache.delete(gamesCache.keys().next().value!);
  const value = axios
    .get<{ events?: Game[]; week?: { teamsOnBye?: NflTeam[] } }>(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
      { params: { dates: year, seasontype: 2, week, limit: 100 }, timeout: 10000 },
    )
    .then(({ data }) => {
      const previous = scheduleHistory.get(key);
      if (!data.events?.length) throw new Error('NFL schedule unavailable');
      const capturedAt = new Date().toISOString();
      const remaining = new Map<string, number>();
      const schedule = new Map<string, NflSchedule>();
      for (const game of data.events) {
        const fraction = gameRemaining(game);
        const kickoff = gameSchedule(game, capturedAt);
        for (const competitor of game.competitions?.[0]?.competitors || []) {
          for (const key of teamKeys(competitor.team ?? {})) {
            remaining.set(key, fraction ?? Number.NaN);
            const prior = previous?.get(key);
            schedule.set(
              key,
              kickoff.status === 'scheduled' &&
                kickoff.kickoffAt &&
                prior?.kickoffAt &&
                (prior.kickoffAt !== kickoff.kickoffAt || prior.status === 'rescheduled')
                ? { ...kickoff, status: 'rescheduled' }
                : kickoff,
            );
          }
        }
      }
      for (const team of data.week?.teamsOnBye ?? []) {
        for (const key of teamKeys(team))
          schedule.set(key, { status: 'bye', source: 'ESPN NFL scoreboard', capturedAt });
      }
      scheduleHistory.delete(key);
      if (scheduleHistory.size >= 36) scheduleHistory.delete(scheduleHistory.keys().next().value!);
      scheduleHistory.set(key, schedule);
      return { remaining, schedule };
    });
  // Cache failed reads too: a provider outage must not trigger one retry per league/player.
  gamesCache.set(key, { expires: Date.now() + 45_000, value });
  return value;
}
export async function nflRemaining(year: number, week: number) {
  return (await nflScoreboard(year, week)).remaining;
}
export async function nflSchedule(year: number, week: number) {
  return (await nflScoreboard(year, week)).schedule;
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

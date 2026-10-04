import axios from 'axios';
import type { LeagueInfo } from './interfaces/league.interface';
export interface NflState {
  season: string;
  leg: number;
  season_type: string;
}
let pending: Promise<NflState> | undefined;
let expires = 0;
export async function getNflState(): Promise<NflState> {
  if (!pending || Date.now() >= expires) {
    expires = Date.now() + 30_000;
    pending = axios
      .get<NflState>('https://api.sleeper.app/v1/state/nfl', { timeout: 10000 })
      .then(({ data }) => data)
      .catch((error) => {
        pending = undefined;
        throw error;
      });
  }
  return pending;
}
export function defaultNflWeek(info: LeagueInfo, state?: NflState) {
  const weeks = info.validWeeks
    .filter((week) => Number.isInteger(week) && week >= 1 && week <= 18)
    .sort((a, b) => a - b);
  const current = Number(state?.season) === info.seasonId;
  if (!current || !weeks.length)
    return {
      isCurrentSeason: false,
      defaultWeek: weeks[0] ?? 1,
      defaultWeekNote: state
        ? 'Historical seasons retain your remembered week; new selections start at the first supported week.'
        : 'NFL season state is unavailable; using your remembered week or the first supported week.',
    };
  const candidate =
    state!.season_type === 'pre'
      ? weeks[0]
      : state!.season_type === 'post' || state!.season_type === 'off'
        ? weeks[weeks.length - 1]
        : (info.currentWeek ?? state!.leg);
  const target = Number.isFinite(candidate) ? candidate : weeks[0];
  const defaultWeek = weeks.reduce(
    (best, week) => (Math.abs(week - target) < Math.abs(best - target) ? week : best),
    weeks[0],
  );
  return {
    isCurrentSeason: true,
    defaultWeek,
    defaultWeekNote: `Current-season default: week ${defaultWeek}, bounded to this league’s supported scoring weeks.`,
  };
}

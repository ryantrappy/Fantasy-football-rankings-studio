import type { League } from './types';

export interface StudioSelection {
  leagueId: string;
  year: number;
  week: number;
}

export interface StudioSearch {
  leagueId?: string;
  year?: number;
  week?: number;
  welcome?: boolean;
}

const leagueIdPattern = /^\d{1,30}$/;
const validYear = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 2000 && Number(value) <= 2100;
const validWeek = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 18;

export function validateStudioSearch(input: Record<string, unknown>): StudioSearch {
  return {
    ...(typeof input.leagueId === 'string' && leagueIdPattern.test(input.leagueId)
      ? { leagueId: input.leagueId }
      : {}),
    ...(validYear(input.year) ? { year: input.year } : {}),
    ...(validWeek(input.week) ? { week: input.week } : {}),
    ...(input.welcome === true ? { welcome: true } : {}),
  };
}

const storageKey = (subject?: string) =>
  subject ? `studio-selection:v1:${JSON.stringify(subject)}` : undefined;

export function readStudioSelection(subject?: string): StudioSelection | undefined {
  const key = storageKey(subject);
  if (!key || typeof window === 'undefined') return undefined;
  try {
    const value = JSON.parse(
      window.localStorage.getItem(key) || 'null',
    ) as Partial<StudioSelection>;
    return value &&
      typeof value.leagueId === 'string' &&
      leagueIdPattern.test(value.leagueId) &&
      validYear(value.year) &&
      validWeek(value.week)
      ? { leagueId: value.leagueId, year: value.year, week: value.week }
      : undefined;
  } catch {
    return undefined;
  }
}

export function rememberStudioSelection(subject: string | undefined, selection: StudioSelection) {
  const key = storageKey(subject);
  if (!key || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(selection));
  } catch {
    // Browser privacy settings can disable storage; the URL and safe defaults still work.
  }
}

export function resolveStudioSelection(
  leagues: League[],
  search: StudioSearch,
  remembered?: StudioSelection,
): StudioSelection | undefined {
  const explicitLeague = leagues.find((entry) => entry.leagueId === search.leagueId);
  const league =
    explicitLeague ||
    leagues.find((entry) => entry.leagueId === remembered?.leagueId) ||
    leagues[0];
  if (!league) return undefined;
  const searchEditionApplies = !search.leagueId || Boolean(explicitLeague);
  const year =
    (searchEditionApplies ? search.year : undefined) ??
    (remembered?.leagueId === league.leagueId ? remembered.year : undefined);
  const resolvedYear = year ?? league.seasonId;
  const week =
    (searchEditionApplies ? search.week : undefined) ??
    (remembered?.leagueId === league.leagueId && remembered.year === resolvedYear
      ? remembered.week
      : 1);
  return { leagueId: league.leagueId, year: resolvedYear, week };
}

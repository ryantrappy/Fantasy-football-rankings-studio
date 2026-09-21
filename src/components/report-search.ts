import { defaultSeason } from '../util/rankings';

export const normalizeLeagueId = (input: unknown) => {
  const leagueId = typeof input === 'string' ? input.replace(/^"(.+)"$/, '$1') : '';
  return /^\d{1,30}$/.test(leagueId) ? leagueId : '';
};

export type ReportPageProps<T> = {
  search: T;
  navigate: (options: { search: T; replace?: boolean }) => Promise<void>;
  shared?: boolean;
  snapshot?: { href: string; years: number[]; openSeason: (year: number) => void };
};
export const validateInsightsPageSearch = (input: Record<string, unknown>) => ({
  leagueId: normalizeLeagueId(input.leagueId),
  year:
    Number.isInteger(Number(input.year)) && Number(input.year) >= 2000 && Number(input.year) <= 2100
      ? Number(input.year)
      : defaultSeason(),
});
export const validateHistoryPageSearch = (
  input: Record<string, unknown>,
): { leagueId: string; years?: number[] } => ({
  leagueId: normalizeLeagueId(input.leagueId),
  ...(Array.isArray(input.years)
    ? {
        years: [
          ...new Set(
            input.years.filter(
              (year): year is number => Number.isInteger(year) && year >= 2000 && year <= 2100,
            ),
          ),
        ].sort((a, b) => b - a),
      }
    : {}),
});

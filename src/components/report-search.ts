import { defaultSeason } from '../util/rankings';
export type ReportPageProps<T> = {
  search: T;
  navigate: (options: { search: T; replace?: boolean }) => Promise<void>;
  shared?: boolean;
};
export const validateInsightsPageSearch = (input: Record<string, unknown>) => ({
  leagueId:
    typeof input.leagueId === 'string' && /^\d{1,30}$/.test(input.leagueId) ? input.leagueId : '',
  year:
    Number.isInteger(Number(input.year)) && Number(input.year) >= 2000 && Number(input.year) <= 2100
      ? Number(input.year)
      : defaultSeason(),
});
export const validateHistoryPageSearch = (
  input: Record<string, unknown>,
): { leagueId: string; years?: number[] } => ({
  leagueId:
    typeof input.leagueId === 'string' && /^\d{1,30}$/.test(input.leagueId) ? input.leagueId : '',
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

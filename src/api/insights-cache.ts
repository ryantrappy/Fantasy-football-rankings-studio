import { defaultSeason } from '../util/rankings';

export const insightsCacheOptions = (year: number) => ({
  staleTime: year < defaultSeason() ? Infinity : 5 * 60 * 1000,
  gcTime: 60 * 60 * 1000,
});

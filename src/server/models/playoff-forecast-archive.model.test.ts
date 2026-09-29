// @vitest-environment node
import { playoffForecastArchiveModel } from './playoff-forecast-archive.model';

it('enforces one archive per provider league, season and completed week without expiration', () => {
  expect(playoffForecastArchiveModel.schema.indexes()).toContainEqual([
    { provider: 1, providerLeagueId: 1, season: 1, completedWeek: 1 },
    { unique: true },
  ]);
  expect(playoffForecastArchiveModel.schema.indexes().some(([keys]) => 'expiresAt' in keys)).toBe(
    false,
  );
});

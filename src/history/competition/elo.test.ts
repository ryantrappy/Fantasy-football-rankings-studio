import { it, expect } from 'vitest';
import { historicalElo } from './elo';
import { season } from './fixtures.test-support';
it('carries ratings chronologically independent of record input order and conserves points', () => {
  const a = season(2023, [[100, 90, 80, 70]]),
    b = season(2024, [[50, 100, 80, 70]]);
  const x = historicalElo([b, a]);
  expect(x).toEqual(historicalElo([a, b]));
  expect(x.movements.find((m) => m.year === 2024 && m.key === 'a')?.before).toBe(1516);
  expect(x.rankings.reduce((n, r) => n + r.rating, 0)).toBeCloseTo(6000);
});
it('uses half-result ties and fresh prior for new identity', () => {
  const r = season(2024, [[80, 80, 80, 80]]);
  expect(historicalElo([r]).rankings.every((x) => x.rating === 1500)).toBe(true);
  const b = season(2025, [[100, 90, 80, 70]]);
  b.data.teams[0].managerKey = 'new';
  expect(historicalElo([r, b]).movements.find((m) => m.key === 'new')?.before).toBe(1500);
});

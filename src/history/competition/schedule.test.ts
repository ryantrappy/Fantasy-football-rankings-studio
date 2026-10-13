import { it, expect } from 'vitest';
import { season } from './fixtures.test-support';
import { historicalSchedules, alternateSchedule } from './schedule';
it('uses scoring percentiles and opponent points, including ties', () => {
  const rows = historicalSchedules(season());
  expect(rows[0]).toMatchObject({
    actual: 1.5,
    expected: 1.5,
    difficulty: 85,
    weeks: 2,
    completed: true,
  });
});
it('replays another schedule without self games and excludes missing data', () => {
  const r = season();
  expect(alternateSchedule(r, 'a', 'c')).toMatchObject({ wins: 2, losses: 0, skipped: 0 });
  expect(alternateSchedule(r, 'a', 'b')).toMatchObject({ skipped: 2 });
  r.data.scores[0].actual = NaN;
  expect(alternateSchedule(r, 'a', 'c')).toMatchObject({ wins: 1, skipped: 1 });
});
it('reports byes and unknown boundaries', () => {
  const r = season();
  r.data.scores[2].opponentTeamId = null;
  r.data.scores[6].opponentTeamId = null;
  expect(alternateSchedule(r, 'a', 'c').byes).toBe(2);
  delete r.data.playoffSettings;
  expect(alternateSchedule(r, 'a', 'c').known).toBe(false);
  expect(historicalSchedules(r)[0].expected).toBeNull();
});

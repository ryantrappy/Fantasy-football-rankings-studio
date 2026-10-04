// @vitest-environment node
import { defaultNflWeek } from '../nfl-week.server';
import type { LeagueInfo } from '../interfaces/league.interface';
const info: LeagueInfo = {
  leagueId: '1',
  leagueName: 'League',
  leagueType: 0,
  seasonId: 2026,
  maxWeek: 17,
  validWeeks: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  scheduleNote: '',
};
it('uses NFL state and ESPN scoring period bounded to the league calendar', () => {
  const state = { season: '2026', leg: 5, season_type: 'regular' };
  expect(defaultNflWeek(info, state)).toMatchObject({ isCurrentSeason: true, defaultWeek: 5 });
  expect(defaultNflWeek({ ...info, currentWeek: 8 }, state).defaultWeek).toBe(8);
  expect(defaultNflWeek(info, { ...state, leg: 20 }).defaultWeek).toBe(17);
  expect(defaultNflWeek(info, { ...state, leg: 1 }).defaultWeek).toBe(3);
});
it('handles preseason, postseason, offseason, and season rollover', () => {
  expect(defaultNflWeek(info, { season: '2026', leg: 0, season_type: 'pre' }).defaultWeek).toBe(3);
  for (const season_type of ['post', 'off'])
    expect(defaultNflWeek(info, { season: '2026', leg: 0, season_type }).defaultWeek).toBe(17);
  expect(defaultNflWeek(info, { season: '2027', leg: 5, season_type: 'regular' })).toMatchObject({
    isCurrentSeason: false,
    defaultWeek: 3,
  });
});
it('uses explicit fallbacks for failed or malformed state and excludes unsupported weeks', () => {
  expect(defaultNflWeek(info)).toMatchObject({ isCurrentSeason: false, defaultWeek: 3 });
  expect(defaultNflWeek(info).defaultWeekNote).toContain('unavailable');
  expect(
    defaultNflWeek(info, { season: '2026', leg: NaN, season_type: 'regular' }).defaultWeek,
  ).toBe(3);
  expect(
    defaultNflWeek({ ...info, validWeeks: [19] }, { season: '2026', leg: 19, season_type: 'post' }),
  ).toMatchObject({ isCurrentSeason: false, defaultWeek: 1 });
});

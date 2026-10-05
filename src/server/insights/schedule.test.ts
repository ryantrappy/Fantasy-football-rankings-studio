import { espnRegularSeasonSchedule } from './schedule';

it('expands published multiweek regular-season periods, including a partly completed matchup', () => {
  const schedule = espnRegularSeasonSchedule({
    settings: {
      scheduleSettings: {
        matchupPeriodCount: 2,
        matchupPeriodLength: 2,
        matchupPeriods: { '1': [1, 2], '2': [3, 4], '3': [5, 6] },
      },
    },
    schedule: [
      { matchupPeriodId: 1, home: { teamId: 1 }, away: { teamId: 2 } },
      { matchupPeriodId: 2, home: { teamId: 1 }, away: { teamId: 3 } },
      {
        matchupPeriodId: 3,
        playoffTierType: 'WINNERS_BRACKET',
        home: { teamId: 1 },
        away: { teamId: 4 },
      },
    ],
  });
  expect(schedule).toEqual({
    endWeek: 4,
    fixtures: [
      { week: 1, homeTeamId: '1', awayTeamId: '2' },
      { week: 2, homeTeamId: '1', awayTeamId: '2' },
      { week: 3, homeTeamId: '1', awayTeamId: '3' },
      { week: 4, homeTeamId: '1', awayTeamId: '3' },
    ],
  });
});

it('preserves explicit byes, supports uniform calendars, and refuses unknown or overlapping mappings', () => {
  expect(
    espnRegularSeasonSchedule({
      settings: { scheduleSettings: { matchupPeriodCount: 2, matchupPeriodLength: 1 } },
      schedule: [{ matchupPeriodId: 2, home: { teamId: 1 } }],
    }),
  ).toEqual({ endWeek: 2, fixtures: [{ week: 2, homeTeamId: '1', awayTeamId: null }] });
  expect(
    espnRegularSeasonSchedule({ settings: { scheduleSettings: { matchupPeriodCount: 2 } } }),
  ).toBeUndefined();
  expect(
    espnRegularSeasonSchedule({
      settings: {
        scheduleSettings: { matchupPeriodCount: 2, matchupPeriods: { '1': [1, 2], '2': [2, 3] } },
      },
    }),
  ).toBeUndefined();
});

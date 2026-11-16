import {
  defaultTeamId,
  picksToFixedOutcomes,
  prefillFromProjections,
  rankLeverage,
  remainingFixtures,
} from './playoff-paths';
import type { SeasonInsights } from './insights';
import type { PlayoffForecast } from './playoff-forecast';

const data = (): SeasonInsights =>
  ({
    completedWeek: 10,
    generatedAt: '',
    notes: [],
    pickups: [],
    trades: [],
    tradeComparisons: [],
    teams: [
      { teamId: 'a', teamName: 'A', combinedWins: 7, combinedLosses: 3, average: 110 },
      { teamId: 'b', teamName: 'B', combinedWins: 5, combinedLosses: 5, average: 100 },
      { teamId: 'c', teamName: 'C', combinedWins: 5, combinedLosses: 5, average: 105 },
      { teamId: 'd', teamName: 'D', combinedWins: 3, combinedLosses: 7, average: 90 },
    ],
    scores: [],
    forecastSchedule: [
      { week: 11, homeTeamId: 'a', awayTeamId: 'b' },
      { week: 11, homeTeamId: 'c', awayTeamId: 'd' },
      { week: 12, homeTeamId: 'a', awayTeamId: 'c' },
      { week: 12, homeTeamId: 'b', awayTeamId: 'd' },
      { week: 13, homeTeamId: 'a', awayTeamId: 'd' },
      { week: 10, homeTeamId: 'a', awayTeamId: 'b' },
      { week: 14, homeTeamId: 'b', awayTeamId: 'c' },
    ],
  }) as unknown as SeasonInsights;

it('lists only remaining fixtures in week order', () => {
  const fixtures = remainingFixtures(data(), 13);
  expect(fixtures.map((f) => `${f.week}:${f.homeTeamId}-${f.awayTeamId}`)).toEqual([
    '11:a-b',
    '11:c-d',
    '12:a-c',
    '12:b-d',
    '13:a-d',
  ]);
});

it('prefills from weekly projections and leaves gaps unset', () => {
  const insights = data();
  insights.playoffProjection = {
    provider: 'Sleeper',
    week: 11,
    teamPoints: { a: 120, b: 110, c: 100, d: 90 },
    coveredStarters: 4,
    totalStarters: 4,
    weekly: [
      {
        week: 11,
        teamPoints: { a: 120, b: 110, c: 100, d: 90 },
        coveredStarters: 4,
        totalStarters: 4,
      },
      { week: 12, teamPoints: { a: 115, c: 118 }, coveredStarters: 2, totalStarters: 4 },
    ],
  };
  const picks = prefillFromProjections(insights, remainingFixtures(insights, 13));
  expect(picks).toEqual({
    '11|a|b': 'a',
    '11|c|d': 'c',
    '12|a|c': 'c',
  });
  expect(picksToFixedOutcomes(picks, remainingFixtures(insights, 13))).toEqual([
    { week: 11, homeTeamId: 'a', awayTeamId: 'b', winnerTeamId: 'a' },
    { week: 11, homeTeamId: 'c', awayTeamId: 'd', winnerTeamId: 'c' },
    { week: 12, homeTeamId: 'a', awayTeamId: 'c', winnerTeamId: 'c' },
  ]);
});

it('falls back to the single-week snapshot and skips ties', () => {
  const insights = data();
  insights.playoffProjection = {
    provider: 'ESPN',
    week: 11,
    teamPoints: { a: 110, b: 110, c: 100, d: 90 },
    coveredStarters: 4,
    totalStarters: 4,
  };
  const picks = prefillFromProjections(insights, remainingFixtures(insights, 13));
  expect(picks).toEqual({ '11|c|d': 'c' });
});

it('ranks leverage by swing for the selected team', () => {
  const forecast = {
    leverage: [
      {
        week: 11,
        homeTeamId: 'a',
        awayTeamId: 'b',
        outcomes: [
          {
            winnerTeamId: 'a',
            chances: [
              { teamId: 'a', playoff: 0.8 },
              { teamId: 'b', playoff: 0.2 },
            ],
          },
          {
            winnerTeamId: 'b',
            chances: [
              { teamId: 'a', playoff: 0.5 },
              { teamId: 'b', playoff: 0.5 },
            ],
          },
        ],
      },
      {
        week: 11,
        homeTeamId: 'c',
        awayTeamId: 'd',
        outcomes: [
          {
            winnerTeamId: 'c',
            chances: [
              { teamId: 'a', playoff: 0.6 },
              { teamId: 'b', playoff: 0.4 },
            ],
          },
          {
            winnerTeamId: 'd',
            chances: [
              { teamId: 'a', playoff: 0.6 },
              { teamId: 'b', playoff: 0.4 },
            ],
          },
        ],
      },
    ],
  } as PlayoffForecast;
  const ranked = rankLeverage(forecast, 'a');
  expect(ranked.map((r) => r.fixture.homeTeamId)).toEqual(['a', 'c']);
  expect(ranked[0]).toMatchObject({ homeChance: 0.8, awayChance: 0.5 });
  expect(ranked[0].swing).toBeCloseTo(0.3, 8);
  expect(rankLeverage(undefined, 'a')).toEqual([]);
});

it('defaults to the best current record', () => {
  expect(defaultTeamId(data())).toBe('a');
  const tied = data();
  tied.teams[0].combinedWins = 5;
  expect(defaultTeamId(tied)).toBe('a');
});

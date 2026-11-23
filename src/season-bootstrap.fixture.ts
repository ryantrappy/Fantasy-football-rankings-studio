import type { SeasonInsights } from './insights';
import type { LiveLeague } from './live-matchups';

const athlete = (id: string) => ({ id, name: id, position: 'RB', starter: true, points: null });
export function bootstrapFixture() {
  const live: LiveLeague = {
    leagueId: '123',
    leagueName: 'Sunday League',
    season: 2026,
    week: 3,
    provider: 'Sleeper',
    lineupSlots: ['RB'],
    matchups: [
      {
        id: 'a-b',
        home: {
          teamId: 'a',
          name: 'Alpha',
          score: null,
          players: [athlete('one'), athlete('rookie')],
        },
        away: { teamId: 'b', name: 'Beta', score: null, players: [athlete('two')] },
      },
    ],
  };
  const report = {
    teams: [{ teamId: 'a' }, { teamId: 'b' }],
    completedWeek: 2,
    regularSeasonSchedule: {
      endWeek: 2,
      fixtures: [1, 2].map((week) => ({ week, homeTeamId: 'a', awayTeamId: 'b' })),
    },
    scores: [1, 2, 3].flatMap((week) => [
      {
        week,
        teamId: 'a',
        starters: [{ playerId: 'one', position: 'RB', points: 10 * week }],
        players: [{ playerId: 'one', points: 10 * week }],
      },
      { week, teamId: 'b', starters: [{ playerId: 'two', position: 'RB', points: 4 * week }] },
    ]),
  } as SeasonInsights;
  return { report, live };
}

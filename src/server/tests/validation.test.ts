import { leagueSchema, rankingSchema, weekSchema } from '../validation';
const ranking = {
  leagueId: '1312529175982129152',
  year: 2026,
  week: 1,
  rankingsTitle: 'Week 1',
  introduction: '',
  teams: [
    {
      teamId: '1',
      teamName: 'Team',
      managerName: '',
      description: '',
      position: 1,
      wins: 0,
      loss: 0,
      ties: 0,
    },
  ],
};
test('preserves long IDs and strips ownership and unexpected input fields', () => {
  const league = leagueSchema.parse({
    leagueId: ranking.leagueId,
    leagueType: 0,
    seasonId: 2026,
    ownerSubject: 'attacker',
  });
  expect(league.leagueId).toBe(ranking.leagueId);
  expect(league).not.toHaveProperty('ownerSubject');
  expect(rankingSchema.parse({ ...ranking, unexpected: true })).not.toHaveProperty('unexpected');
});
test('rejects invalid weeks, oversized content, duplicate teams, and malformed nested fields', () => {
  for (const input of [
    { ...ranking, week: 19 },
    { ...ranking, year: 1999 },
    { ...ranking, teams: [...ranking.teams, ...ranking.teams] },
    { ...ranking, teams: [{ ...ranking.teams[0], wins: -1 }] },
    { ...ranking, rankingsTitle: 'x'.repeat(201) },
  ]) {
    expect(rankingSchema.safeParse(input).success).toBe(false);
  }
  expect(weekSchema.safeParse({ leagueId: '123', year: 2026, week: '1' }).success).toBe(false);
});

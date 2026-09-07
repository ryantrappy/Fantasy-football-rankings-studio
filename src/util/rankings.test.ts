import { describe, expect, it } from 'vitest';
import type { League, TeamRanking, WeeklyRanking } from '../types';
import { defaultSeason, moveTeam, newRanking, previousPosition } from './rankings';

const teams: TeamRanking[] = ['first-team', 'second-team', 'third-team'].map((teamId, index) => ({
  teamId,
  teamName: teamId,
  managerName: 'Manager',
  wins: 0,
  loss: 0,
  ties: 0,
  description: 'Retain commentary',
  position: index + 1,
}));
const league: League = {
  leagueId: 'league-1',
  leagueName: 'Friends',
  leagueType: 1,
  seasonId: 2026,
};
const current = newRanking(league, 2026, 3, teams);

describe('ranking calculations', () => {
  it('moves nonnumeric team IDs in either direction and renumbers every position without changing input', () => {
    const moved = moveTeam(teams, 2, 0);
    expect(moved.map((team) => [team.teamId, team.position])).toEqual([
      ['third-team', 1],
      ['first-team', 2],
      ['second-team', 3],
    ]);
    expect(moved[0].description).toBe('Retain commentary');
    expect(moveTeam(moved, 0, 2)).toEqual(teams);
    expect(teams.map((team) => team.teamId)).toEqual(['first-team', 'second-team', 'third-team']);
  });

  it('ignores moves past either edge of the ranking', () => {
    expect(moveTeam(teams, 0, -1)).toEqual(teams);
    expect(moveTeam(teams, 2, 3)).toEqual(teams);
    expect(moveTeam(teams, -1, 0)).toEqual(teams);
  });

  it('calculates previous position only from the same league, season, and immediately preceding week', () => {
    const history: WeeklyRanking[] = [
      { ...current, year: 2025, week: 2 },
      { ...current, leagueId: 'other-league', week: 2 },
      { ...current, week: 1 },
      { ...current, week: 2, teams: moveTeam(teams, 0, 2) },
    ];
    expect(previousPosition(history, current, 'first-team')).toBe(3);
    expect(previousPosition(history, current, 'third-team')).toBe(2);
    expect(previousPosition(history, current, 'unknown-team')).toBeUndefined();
    expect(previousPosition(history.slice(0, 3), current, 'first-team')).toBeUndefined();
    expect(previousPosition(history, { ...current, week: 1 }, 'first-team')).toBeUndefined();
  });

  it('builds equivalent league drafts for either provider with ordered teams and empty commentary', () => {
    for (const leagueType of [0, 1] as const) {
      const ranking = newRanking({ ...league, leagueType }, 2026, 4, teams);
      expect(ranking).toMatchObject({
        leagueId: 'league-1',
        year: 2026,
        week: 4,
        introduction: '',
      });
      expect(ranking._id).toBeUndefined();
      expect(ranking.teams.map((team) => [team.teamId, team.position, team.description])).toEqual([
        ['first-team', 1, ''],
        ['second-team', 2, ''],
        ['third-team', 3, ''],
      ]);
    }
  });

  it('keeps January through March in the previous football season', () => {
    expect(defaultSeason(new Date(2026, 0, 15))).toBe(2025);
    expect(defaultSeason(new Date(2026, 2, 31))).toBe(2025);
    expect(defaultSeason(new Date(2026, 3, 1))).toBe(2026);
    expect(defaultSeason(new Date(2026, 8, 6))).toBe(2026);
  });
});

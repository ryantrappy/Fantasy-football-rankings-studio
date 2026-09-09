import axios from 'axios';
import SleeperProvider from './sleeper.provider';
import EspnProvider from './espn.provider';
import { League } from '../interfaces/league.interface';

vi.mock('axios');
const get = vi.mocked(axios.get);
const league: League = { leagueId: '123', leagueName: '', leagueType: 0, seasonId: 2026 };
afterEach(() => vi.resetAllMocks());

describe('Provider normalization', () => {
  it('normalizes Sleeper teams with missing owners and metadata', async () => {
    get.mockResolvedValueOnce({ data: { league_id: '123', season: '2026' } });
    get.mockResolvedValueOnce({
      data: [
        { roster_id: 1, owner_id: 'a', settings: { wins: 2, losses: 1, ties: 0 } },
        { roster_id: 2 },
      ],
    });
    get.mockResolvedValueOnce({ data: [{ user_id: 'a', display_name: 'Alex' }] });
    const teams = await new SleeperProvider().getTeams(league, 2026, 3);
    expect(teams[0]).toEqual({
      teamId: '1',
      teamName: 'Alex',
      managerName: 'Alex',
      managerKey: 'sleeper:a',
      wins: 2,
      loss: 1,
      ties: 0,
    });
    expect(teams[1]).toEqual({
      teamId: '2',
      teamName: 'Team 2',
      managerName: 'Unassigned manager',
      wins: 0,
      loss: 0,
      ties: 0,
    });
  });

  it('resolves a linked historical season and preserves provider type', async () => {
    get.mockResolvedValueOnce({
      data: { league_id: '123', season: '2026', previous_league_id: '122' },
    });
    get.mockResolvedValueOnce({
      data: { league_id: '122', season: '2025', name: 'Old league', total_rosters: 12 },
    });
    const result = await new SleeperProvider().getLeague(league, 2025);
    expect(result).toMatchObject({
      leagueId: '123',
      seasonId: 2025,
      leagueType: 0,
      leagueName: 'Old league',
      teamCount: 12,
    });
  });

  it('rejects unavailable future seasons instead of silently using current data', async () => {
    get.mockResolvedValueOnce({ data: { league_id: '123', season: '2026' } });
    await expect(new SleeperProvider().getLeague(league, 2027)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('normalizes ESPN teams to the same contract as Sleeper', async () => {
    get.mockResolvedValueOnce({
      data: {
        id: 123,
        teams: [
          {
            id: 1,
            location: 'Cool',
            nickname: 'Cats',
            owners: ['a'],
            record: { overall: { wins: 2, losses: 1, ties: 0 } },
          },
        ],
        members: [{ id: 'a', firstName: 'Alex', lastName: 'Smith' }],
      },
    });
    const teams = await new EspnProvider().getTeams({ ...league, leagueType: 1 }, 2026, 3);
    expect(teams[0]).toEqual({
      teamId: '1',
      teamName: 'Cool Cats',
      managerName: 'Alex Smith',
      managerKey: 'espn:a',
      wins: 2,
      loss: 1,
      ties: 0,
    });
    expect(get.mock.calls[0][1]).toMatchObject({ timeout: 10000 });
  });

  it('groups Sleeper matchups and keeps each bye separate', async () => {
    get.mockResolvedValueOnce({ data: { league_id: '123', season: '2026' } });
    get.mockResolvedValueOnce({
      data: [
        { matchup_id: 1, roster_id: 1, points: 100 },
        { matchup_id: 1, roster_id: 2, points: 80, custom_points: 90 },
        { matchup_id: null, roster_id: 3, points: 70 },
        { matchup_id: null, roster_id: 4, points: 60 },
      ],
    });
    const matchups = await new SleeperProvider().getMatchups(league, 2026, 1);
    expect(matchups).toHaveLength(3);
    expect(matchups[0]).toEqual({
      matchupId: '1',
      homeTeamId: '1',
      awayTeamId: '2',
      homeScore: 100,
      awayScore: 90,
    });
    expect(matchups[1].awayTeamId).toBeNull();
  });
});

it('keeps Sleeper co-owner identities stable across ordering and separates changed groups', async () => {
  const read = async (co_owners: string[], name = 'Original') => {
    get.mockResolvedValueOnce({ data: { league_id: '123', season: '2026' } });
    get.mockResolvedValueOnce({ data: [{ roster_id: 1, owner_id: 'a', co_owners }] });
    get.mockResolvedValueOnce({
      data: [
        { user_id: 'a', display_name: 'Alex', metadata: { team_name: name } },
        { user_id: 'b', display_name: 'Blair' },
        { user_id: 'c', display_name: 'Casey' },
      ],
    });
    return (await new SleeperProvider().getTeams(league, 2026, 1))[0];
  };
  const first = await read(['c', 'b', 'a']);
  const renamed = await read(['b', 'c'], 'Renamed');
  const changed = await read(['b']);
  expect(first.managerKey).toBe('sleeper:a,b,c');
  expect(renamed.managerKey).toBe(first.managerKey);
  expect(first.managerName).toBe('Alex, Blair, Casey');
  expect(renamed.teamName).toBe('Renamed');
  expect(changed.managerKey).toBe('sleeper:a,b');
});

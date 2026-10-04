// @vitest-environment node
import { loadWaiverPool } from '../waivers.server';
import { loadLiveLeague } from '../live-matchups.server';
import { sleeperNames } from '../insights/load.server';
import { sleeperLiveProjections, nflRemaining } from '../live-projections.server';
import SleeperProvider from '../providers/sleeper.provider';
vi.mock('../live-matchups.server', () => ({ loadLiveLeague: vi.fn() }));
vi.mock('../insights/load.server', () => ({ sleeperNames: vi.fn() }));
vi.mock('../live-projections.server', () => ({
  sleeperLiveProjections: vi.fn(),
  nflRemaining: vi.fn(),
}));
const league = {
  leagueId: '1',
  leagueName: 'League',
  providerLeagueId: '99',
  seasonId: 2026,
  leagueType: 0 as const,
};
afterEach(() => vi.restoreAllMocks());
it('returns explicit unsupported ESPN coverage without claiming availability', async () => {
  const data = await loadWaiverPool({ ...league, leagueType: 1 }, '1', 'public');
  expect(data.unavailable).toContain('unsupported');
  expect(data.candidates).toEqual([]);
  expect(loadLiveLeague).not.toHaveBeenCalled();
});
it('uses complete ownership and league scoring and rejects incomplete coverage', async () => {
  vi.mocked(loadLiveLeague).mockResolvedValue({
    leagueId: '1',
    leagueName: 'League',
    provider: 'Sleeper',
    season: 2026,
    week: 5,
    lineupSlots: ['RB'],
    matchups: [
      {
        id: '1',
        home: {
          teamId: '1',
          name: 'Me',
          score: null,
          players: [
            { id: 'owned', name: 'Owned', starter: true, points: null },
            { id: 'old', name: 'Former roster', starter: false, points: null },
          ],
        },
        away: null,
      },
    ],
  });
  vi.spyOn(SleeperProvider.prototype, 'resolveSeason').mockResolvedValue({
    league_id: '99',
    name: 'League',
    season: '2026',
    total_rosters: 2,
    scoring_settings: { rush_yd: 0.1 },
  });
  const read = vi.spyOn(SleeperProvider.prototype, 'get').mockResolvedValue([
    { roster_id: 1, players: ['owned'] },
    { roster_id: 2, players: ['other'], reserve: ['ir'] },
  ]);
  vi.mocked(sleeperNames).mockResolvedValue({
    expires: 0,
    names: { free: 'Free agent' },
    positions: { free: 'RB', owned: 'RB', other: 'RB', ir: 'RB' },
    teams: { free: 'KC' },
    availability: {},
  });
  vi.mocked(sleeperLiveProjections).mockResolvedValue([
    { player_id: 'free', stats: { rush_yd: 100 } },
  ]);
  vi.mocked(nflRemaining).mockResolvedValue(new Map([['KC', 1]]));
  const result = await loadWaiverPool(league, '1', 'public');
  expect(result.candidates).toEqual([
    expect.objectContaining({ id: 'free', projectedPoints: 10, locked: false, bye: false }),
  ]);
  expect(result.team!.players.map((player) => player.id)).toEqual(['owned']);
  read.mockResolvedValueOnce([{ roster_id: 1, players: ['owned'] }]);
  expect((await loadWaiverPool(league, '1', 'public')).unavailable).toContain('incomplete');
});

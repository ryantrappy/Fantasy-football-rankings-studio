import axios from 'axios';
import { render, screen } from '@testing-library/react';
import SleeperProvider from './sleeper.provider';
import EspnProvider from './espn.provider';
import { RankingPreview } from '../../components/RankingPreview';
import { Provider } from '../../components/ui/provider';
import { newRanking } from '../../util/rankings';

vi.mock('axios');
const league = { leagueId: '123', leagueName: 'League', leagueType: 0 as const, seasonId: 2026 };
const teams = ['1', '2'].map((teamId) => ({
  teamId,
  teamName: `Team ${teamId}`,
  managerName: 'Manager',
  wins: 9,
  loss: 5,
  ties: 1,
}));
afterEach(() => vi.restoreAllMocks());
function sleeper() {
  const provider = new SleeperProvider();
  vi.spyOn(provider, 'resolveSeason').mockResolvedValue({
    league_id: '123',
    season: '2026',
    name: 'League',
    total_rosters: 2,
    settings: { last_scored_leg: 4, playoff_week_start: 15 },
  });
  vi.spyOn(provider, 'getTeams').mockResolvedValue(teams);
  vi.mocked(axios.get).mockResolvedValue({
    data: { season: '2026', season_type: 'regular', leg: 5 },
  });
  const get = vi.spyOn(provider, 'get').mockImplementation(async (path) => {
    const week = Number(path.split('/').at(-1));
    return [
      { roster_id: 1, matchup_id: 1, points: week === 1 ? 100 : 90 },
      { roster_id: 2, matchup_id: 1, points: week === 2 ? 100 : 90 },
    ] as never;
  });
  return { provider, get };
}
it('reconstructs older Sleeper wins/losses/ties without reading later games and exports that record', async () => {
  const { provider, get } = sleeper();
  const older = await provider.getHistoricalTeams(league, 2026, 1);
  expect(older[0]).toMatchObject({ wins: 1, loss: 0, ties: 0 });
  expect(get).toHaveBeenCalledTimes(1);
  const later = await provider.getHistoricalTeams(league, 2026, 3);
  expect(later[0]).toMatchObject({ wins: 1, loss: 1, ties: 1 });
  render(
    <Provider>
      <RankingPreview league={league} ranking={newRanking(league, 2026, 3, later)} history={[]} />
    </Provider>,
  );
  expect(screen.getAllByText('1-1-1')).toHaveLength(2);
  expect(teams[0].wins).toBe(9);
});
it('excludes ongoing Sleeper games and reports incomplete weekly coverage', async () => {
  const { provider, get } = sleeper();
  await provider.getHistoricalTeams(league, 2026, 10);
  expect(get).toHaveBeenCalledTimes(4);
  get.mockResolvedValue([]);
  await expect(provider.getHistoricalTeams(league, 2026, 1)).rejects.toMatchObject({ status: 422 });
});
it('uses completed ESPN period boundaries and recorded winners instead of current standings', async () => {
  const provider = new EspnProvider();
  vi.spyOn(provider, 'getTeams').mockResolvedValue(teams);
  vi.spyOn(provider, 'get').mockResolvedValue({
    id: 123,
    settings: {
      scoringSettings: { scoringType: 'H2H_POINTS' },
      scheduleSettings: {
        matchupPeriodCount: 3,
        matchupPeriods: { '1': [1, 2], '2': [3, 4], '3': [5, 6] },
      },
    },
    status: { latestScoringPeriod: 7, finalScoringPeriod: 18 },
    schedule: ['HOME', 'AWAY', 'TIE'].map((winner, index) => ({
      id: index,
      matchupPeriodId: index + 1,
      winner,
      home: { teamId: 1, totalPoints: 100 },
      away: { teamId: 2, totalPoints: 100 },
    })),
  } as never);
  expect((await provider.getHistoricalTeams(league, 2026, 3))[0]).toMatchObject({
    wins: 1,
    loss: 0,
    ties: 0,
  });
  expect((await provider.getHistoricalTeams(league, 2026, 6))[0]).toMatchObject({
    wins: 1,
    loss: 1,
    ties: 1,
  });
});
it('does not substitute current records when ESPN metadata is missing', async () => {
  const provider = new EspnProvider();
  vi.spyOn(provider, 'getTeams').mockResolvedValue(teams);
  vi.spyOn(provider, 'get').mockResolvedValue({ id: 123 });
  await expect(provider.getHistoricalTeams(league, 2026, 2)).rejects.toMatchObject({
    status: 422,
    message: expect.stringContaining('Current season records have not been substituted'),
  });
});

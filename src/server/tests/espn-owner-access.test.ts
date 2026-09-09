// @vitest-environment node
import axios from 'axios';
import { getEspnCredentials } from '../espn-credentials.server';
import leagueModel from '../models/league.model';
import LeaguesService from '../services/leagues.service';
import { operations } from '../operations.server';
import { loadInsights } from '../insights/load.server';
import { discoverSeasons } from '../insights/seasons.server';
vi.mock('axios', () => ({ default: { get: vi.fn() } }));
vi.mock('../espn-credentials.server', () => ({
  getEspnCredentials: vi.fn(),
  getEspnCredentialStatus: vi.fn(),
  saveEspnCredentials: vi.fn(),
  removeEspnCredentials: vi.fn(),
  skipEspnSetup: vi.fn(),
}));
vi.mock('../models/league.model', () => ({
  default: { findOne: vi.fn(), exists: vi.fn(), create: vi.fn() },
}));
vi.mock('../insights/load.server', () => ({ loadInsights: vi.fn() }));
vi.mock('../insights/seasons.server', () => ({ discoverSeasons: vi.fn() }));
const league = { leagueId: '123', leagueName: 'Test', leagueType: 1, seasonId: 2025 };
const service = new LeaguesService();
beforeEach(() => {
  vi.stubEnv('ESPN_S2', 'global-secret');
  vi.stubEnv('SWID', 'global-swid');
  vi.mocked(getEspnCredentials).mockImplementation(async (owner) => ({
    espnS2: `${owner}-s2`,
    swid: `${owner}-swid`,
  }));
  vi.mocked(leagueModel.findOne).mockImplementation(() => ({ lean: async () => league }) as never);
  vi.mocked(axios.get).mockResolvedValue({ data: { id: 123, teams: [], schedule: [] } });
  vi.mocked(leagueModel.exists).mockResolvedValue(null);
  vi.mocked(leagueModel.create).mockImplementation(async (data) => data as never);
});
afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});
it('isolates cookies for concurrent owners across metadata, teams, matchups and creation', async () => {
  await Promise.all([
    service.getLeagueInfo('123', 2025, 'owner-a'),
    service.getTeams('123', 2025, 1, 'owner-b'),
    service.getMatchups('123', 2025, 1, 'owner-c'),
    service.createNewLeague(league, 'owner-d'),
  ]);
  const cookies = vi.mocked(axios.get).mock.calls.map(([, options]) => options?.headers?.Cookie);
  expect(cookies.sort()).toEqual(
    ['a', 'b', 'c', 'd'].map((id) => `espn_s2=owner-${id}-s2; SWID=owner-${id}-swid`),
  );
});
it('loads credentials only after verifying league ownership', async () => {
  vi.mocked(leagueModel.findOne).mockReturnValue({ lean: async () => null } as never);
  await expect(
    operations.getInsights('owner-a', { leagueId: '123', year: 2025 }),
  ).rejects.toMatchObject({ status: 404 });
  expect(leagueModel.findOne).toHaveBeenCalledWith({ leagueId: '123', ownerSubject: 'owner-a' });
  expect(getEspnCredentials).not.toHaveBeenCalled();
});
it('passes owner credentials through discovery and insight reads', async () => {
  await operations.getInsights('owner-a', { leagueId: '123', year: 2025 });
  await operations.getLeagueSeasons('owner-b', { leagueId: '123' });
  expect(loadInsights).toHaveBeenCalledWith(league, 2025, {
    espnS2: 'owner-a-s2',
    swid: 'owner-a-swid',
  });
  expect(discoverSeasons).toHaveBeenCalledWith(league, {
    espnS2: 'owner-b-s2',
    swid: 'owner-b-swid',
  });
});
it('does not load credentials for Sleeper', async () => {
  await service.providerFor({ ...league, leagueType: 0 }, 'owner-a');
  expect(await service.espnAccess({ ...league, leagueType: 0 }, 'owner-a')).toBe('public');
  expect(getEspnCredentials).not.toHaveBeenCalled();
});
it('missing per-user cookies never falls back to global environment cookies', async () => {
  vi.mocked(getEspnCredentials).mockResolvedValue(undefined);
  await service.getLeagueInfo('123', 2025, 'owner-a');
  expect(vi.mocked(axios.get).mock.calls[0][1]?.headers).not.toHaveProperty('Cookie');
});

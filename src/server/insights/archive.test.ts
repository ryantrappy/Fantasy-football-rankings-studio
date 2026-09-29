// @vitest-environment node
import { archivePlayoffForecast } from './archive.server';
import { calculateInsights } from './calculate';
import type { InsightsSource } from '../../insights';
import { LeagueType, type League } from '../interfaces/league.interface';
import { connectDatabase } from '../database.server';
import { playoffForecastArchiveModel } from '../models/playoff-forecast-archive.model';

vi.mock('../database.server', () => ({ connectDatabase: vi.fn() }));
vi.mock('../models/playoff-forecast-archive.model', () => ({
  playoffForecastArchiveModel: { init: vi.fn(), exists: vi.fn(), updateOne: vi.fn() },
}));

const league: League = {
  leagueId: 'internal',
  providerLeagueId: '1140768',
  leagueName: 'Test league',
  leagueType: LeagueType.Espn,
  seasonId: 2026,
};
const source = (): InsightsSource => ({
  completedWeek: 1,
  teams: [
    { teamId: '1', teamName: 'One', managerName: 'A', managerKey: 'secret-a' },
    { teamId: '2', teamName: 'Two', managerName: 'B', managerKey: 'secret-b' },
  ],
  scores: [
    { teamId: '1', week: 1, actual: 110, projected: null, opponentTeamId: '2', starters: [] },
    { teamId: '2', week: 1, actual: 100, projected: null, opponentTeamId: '1', starters: [] },
  ],
  moves: [],
  draftPickTrades: 0,
  playerNames: {},
  playerPositions: { p1: 'QB', p2: 'QB', unowned: 'QB' },
  notes: [],
  playoffSettings: { regularSeasonEnd: 3, playoffTeams: 2 },
  forecastSchedule: [
    { week: 2, homeTeamId: '1', awayTeamId: '2' },
    { week: 3, homeTeamId: '2', awayTeamId: '1' },
  ],
  rosterSnapshot: {
    capturedAt: '2026-09-08T12:00:00Z',
    teams: [
      { teamId: '1', starters: ['p1'], bench: [] },
      { teamId: '2', starters: ['p2'], bench: [] },
    ],
  },
  forecastContext: {
    rosterSlots: { '0': 1 },
    injuryStatuses: { p2: 'QUESTIONABLE' },
    byeWeeks: { p1: 5 },
  },
  playoffProjection: {
    provider: 'ESPN',
    capturedAt: '2026-09-08T12:05:00Z',
    week: 2,
    teamPoints: { '1': 120, '2': 115 },
    coveredStarters: 2,
    totalStarters: 2,
    weekly: [2, 3, 4].map((week) => ({
      week,
      teamPoints: { '1': 120, '2': 115 },
      coveredStarters: 2,
      totalStarters: 2,
      lineups: { '1': ['p1'], '2': ['p2'] },
    })),
  },
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-08T12:10:00Z'));
  vi.mocked(playoffForecastArchiveModel.exists).mockResolvedValue(null);
  vi.mocked(playoffForecastArchiveModel.updateOne).mockResolvedValue({} as never);
});
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

it('stores one compact, immutable weekly forecast with frozen validation inputs', async () => {
  const input = source();
  await archivePlayoffForecast(league, 2026, input, calculateInsights(input));
  expect(connectDatabase).toHaveBeenCalledTimes(1);
  expect(playoffForecastArchiveModel.updateOne).toHaveBeenCalledTimes(1);
  const [key, update, options] = vi.mocked(playoffForecastArchiveModel.updateOne).mock.calls[0];
  expect(key).toEqual({
    provider: 'ESPN',
    providerLeagueId: '1140768',
    season: 2026,
    completedWeek: 1,
  });
  expect(options).toEqual({ upsert: true });
  const archive = (update as { $setOnInsert: Record<string, any> }).$setOnInsert;
  expect(archive).toMatchObject({
    schemaVersion: 1,
    modelVersion: expect.any(String),
    inputs: {
      playoffSettings: { regularSeasonEnd: 3, playoffTeams: 2 },
      rosterSlots: { '0': 1 },
      injuryStatuses: { p2: 'QUESTIONABLE' },
      byeWeeks: { p1: 5 },
      playerPositions: { p1: 'QB', p2: 'QB' },
      providerProjections: {
        weekly: expect.arrayContaining([
          {
            week: 2,
            teamPoints: { '1': 120, '2': 115 },
            coveredStarters: 2,
            totalStarters: 2,
            lineups: { '1': ['p1'], '2': ['p2'] },
          },
        ]),
      },
    },
    forecast: {
      simulations: 20000,
      rows: expect.arrayContaining([expect.objectContaining({ teamId: '1' })]),
    },
  });
  expect(archive.inputs.teams).toEqual([
    { teamId: '1', teamName: 'One' },
    { teamId: '2', teamName: 'Two' },
  ]);
  expect(archive.inputs.providerProjections.teamPoints).toBeUndefined();
  expect(archive.capturedAt).toEqual(new Date('2026-09-08T12:10:00Z'));
});

it('reuses an existing league-week entry and skips historical or unusable forecasts', async () => {
  const input = source();
  vi.mocked(playoffForecastArchiveModel.exists).mockResolvedValueOnce({ _id: 'existing' } as never);
  await archivePlayoffForecast(league, 2026, input, calculateInsights(input));
  expect(playoffForecastArchiveModel.updateOne).not.toHaveBeenCalled();

  await archivePlayoffForecast(league, 2025, input, calculateInsights(input));
  expect(playoffForecastArchiveModel.exists).toHaveBeenCalledTimes(1);

  input.playoffProjection = undefined;
  await archivePlayoffForecast(league, 2026, input, calculateInsights(input));
  expect(playoffForecastArchiveModel.exists).toHaveBeenCalledTimes(1);
});

it('treats a concurrent unique-key conflict as a successful first capture', async () => {
  const input = source();
  vi.mocked(playoffForecastArchiveModel.updateOne).mockRejectedValueOnce({ code: 11000 });
  await expect(
    archivePlayoffForecast(league, 2026, input, calculateInsights(input)),
  ).resolves.toBeUndefined();
});

// @vitest-environment node
import { executePublic } from '../operations.server';
import { publicInsights } from '../public-insights.server';
import { verifyAuthorization } from '../auth.server';
import { connectDatabase } from '../database.server';
import leagueModel from '../models/league.model';
import { discoverSeasons } from '../insights/seasons.server';
import { loadInsights } from '../insights/load.server';

vi.mock('../auth.server', () => ({ verifyAuthorization: vi.fn() }));
vi.mock('../database.server', () => ({ connectDatabase: vi.fn() }));
vi.mock('../insights/seasons.server', () => ({ discoverSeasons: vi.fn() }));
vi.mock('../insights/load.server', () => ({ loadInsights: vi.fn() }));
vi.mock('../models/league.model', () => ({ default: { findOne: vi.fn() } }));
const league = { leagueId: '123', leagueName: 'Shared league', leagueType: 0, seasonId: 2026 };
const lean = vi.fn();
const select = vi.fn(() => ({ lean }));
beforeEach(() => {
  vi.clearAllMocks();
  lean.mockResolvedValue({
    ...league,
    _id: 'internal',
    ownerSubject: 'private-owner',
    createdAt: 'internal',
  });
  vi.mocked(leagueModel.findOne).mockReturnValue({ select } as unknown as ReturnType<
    typeof leagueModel.findOne
  >);
});
test('anonymous reads expose only the specified league metadata, without owner or database identifiers', async () => {
  expect(await executePublic(() => publicInsights.getLeague({ leagueId: '123' }))).toEqual({
    ok: true,
    data: league,
  });
  expect(verifyAuthorization).not.toHaveBeenCalled();
  expect(leagueModel.findOne).toHaveBeenCalledWith({ leagueId: '123', publicReports: { $ne: false } });
  expect(select).toHaveBeenCalledWith({
    _id: 0,
    leagueId: 1,
    leagueName: 1,
    leagueType: 1,
    seasonId: 1,
  });
});
test('anonymous season and insight reads use the registered league', async () => {
  vi.mocked(discoverSeasons).mockResolvedValue({
    years: [2026],
    activeSeason: 2026,
    activeManagerKeys: [],
  });
  await executePublic(() => publicInsights.getLeagueSeasons({ leagueId: '123' }));
  await executePublic(() => publicInsights.getInsights({ leagueId: '123', year: 2025 }));
  expect(discoverSeasons).toHaveBeenCalledWith(league, 'public');
  expect(loadInsights).toHaveBeenCalledWith(league, 2025, 'public');
  expect(verifyAuthorization).not.toHaveBeenCalled();
});
test.each([
  () => publicInsights.getLeague({ leagueId: { $ne: '' } }),
  () => publicInsights.getLeagueSeasons({ leagueId: 'bad' }),
  () => publicInsights.getInsights({ leagueId: '123', year: 1999 }),
])('rejects invalid public input before database or provider access', async (action) => {
  expect(await executePublic<unknown>(action)).toMatchObject({ ok: false, error: { status: 400 } });
  expect(connectDatabase).not.toHaveBeenCalled();
  expect(loadInsights).not.toHaveBeenCalled();
});
test('unknown leagues return 404 without contacting a provider', async () => {
  lean.mockResolvedValue(null);
  expect(
    await executePublic(() => publicInsights.getInsights({ leagueId: '456', year: 2025 })),
  ).toMatchObject({ ok: false, error: { status: 404 } });
  expect(loadInsights).not.toHaveBeenCalled();
});

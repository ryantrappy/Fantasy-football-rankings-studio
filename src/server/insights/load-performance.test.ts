// @vitest-environment node
import axios from 'axios';
import { loadInsightsSource } from './load.server';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
vi.mock('./projection-cache.server', () => ({
  cachedFutureProjection: vi.fn((_context, read) => read()),
}));
const get = vi.mocked(axios.get);
const league = { leagueId: '123', leagueName: 'League', leagueType: 0 as const, seasonId: 2026 };

afterEach(() => {
  vi.restoreAllMocks();
  get.mockReset();
});

function pendingSeason(year: number, complete = false) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started: string[] = [];
  get.mockImplementation(async (url): Promise<any> => {
    const path = String(url).replace('https://api.sleeper.app', '');
    started.push(path);
    if (path === '/v1/league/123')
      return {
        data: {
          league_id: '123',
          season: String(year),
          name: 'League',
          total_rosters: 2,
          status: complete ? 'complete' : 'in_season',
          settings: { last_scored_leg: 2, playoff_week_start: 5, playoff_teams: 2 },
          roster_positions: ['RB'],
          scoring_settings: { rush_yd: 0.1 },
        },
      };
    if (path === '/v1/state/nfl')
      return { data: { season: '2026', season_type: 'regular', leg: 3 } };
    if (path === '/v1/league/123/rosters')
      return {
        data: [
          { roster_id: 1, owner_id: 'a', players: ['p1'], starters: ['p1'] },
          { roster_id: 2, owner_id: 'b', players: ['p2'], starters: ['p2'] },
        ],
      };
    if (path === '/v1/league/123/users')
      return {
        data: [
          { user_id: 'a', display_name: 'One' },
          { user_id: 'b', display_name: 'Two' },
        ],
      };
    if (path === '/v1/players/nfl')
      return {
        data: {
          p1: { full_name: 'First Player', position: 'RB', team: 'CHI' },
          p2: { full_name: 'Second Player', position: 'RB', team: 'GB' },
        },
      };
    if (path.includes('/matchups/')) {
      const week = Number(path.split('/').at(-1));
      if (week <= 2) await gate;
      return {
        data: [1, 2].map((id) => ({
          roster_id: id,
          matchup_id: 1,
          points: 10 * week + id,
          players: [`p${id}`],
          starters: [`p${id}`],
          players_points: { [`p${id}`]: 10 * week + id },
        })),
      };
    }
    return { data: [] };
  });
  return { started, release };
}

it('overlaps draft, catalog and future schedule reads and reuses report metadata and rosters', async () => {
  const { started, release } = pendingSeason(2026);
  const report = loadInsightsSource(league, 2026);
  try {
    await vi.waitFor(() => {
      expect(started).toContain('/v1/league/123/matchups/1');
      expect(started).toContain('/v1/league/123/matchups/2');
      expect(started).toContain('/v1/league/123/drafts');
      expect(started).toContain('/v1/players/nfl');
      expect(started).toContain('/v1/league/123/matchups/3');
      expect(started).toContain('/v1/league/123/matchups/4');
    });
  } finally {
    release();
  }
  const source = await report;
  expect(started.filter((path) => path === '/v1/league/123')).toHaveLength(1);
  expect(started.filter((path) => path === '/v1/league/123/rosters')).toHaveLength(1);
  expect(source.scores.map(({ week, teamId, actual }) => ({ week, teamId, actual }))).toEqual([
    { week: 1, teamId: '1', actual: 11 },
    { week: 1, teamId: '2', actual: 12 },
    { week: 2, teamId: '1', actual: 21 },
    { week: 2, teamId: '2', actual: 22 },
  ]);
  expect(source.forecastSchedule).toEqual(
    [1, 2, 3, 4].map((week) => ({
      week,
      homeTeamId: '1',
      awayTeamId: '2',
    })),
  );
  expect(source.rosterSnapshot?.teams).toEqual([
    { teamId: '1', starters: ['p1'], bench: [] },
    { teamId: '2', starters: ['p2'], bench: [] },
  ]);

  await loadInsightsSource(league, 2026);
  expect(started.filter((path) => path === '/v1/league/123')).toHaveLength(2);
  expect(started.filter((path) => path === '/v1/league/123/rosters')).toHaveLength(2);
});

it('starts completed-season bracket reads while weekly scores are still pending', async () => {
  const { started, release } = pendingSeason(2025, true);
  const report = loadInsightsSource(league, 2025);
  try {
    await vi.waitFor(() => {
      expect(started).toContain('/v1/league/123/matchups/1');
      expect(started).toContain('/v1/league/123/winners_bracket');
      expect(started).toContain('/v1/league/123/losers_bracket');
    });
  } finally {
    release();
  }
  expect((await report).completedWeek).toBe(2);
});

it('retries an early catalog failure when the later roster section needs player details', async () => {
  const now = Date.now();
  vi.spyOn(Date, 'now').mockReturnValue(now + 6 * 60 * 1000);
  const { release } = pendingSeason(2026);
  const read = get.getMockImplementation()!;
  let catalogs = 0;
  get.mockImplementation((url, options) => {
    if (String(url).endsWith('/players/nfl') && ++catalogs === 1)
      return Promise.reject(new Error('temporary catalog failure'));
    return read(url, options);
  });
  release();
  const source = await loadInsightsSource(league, 2026);
  expect(catalogs).toBe(2);
  expect(source.playerNames).toEqual({ p1: 'First Player', p2: 'Second Player' });
  expect(source.rosterSnapshot?.teams).toHaveLength(2);
});

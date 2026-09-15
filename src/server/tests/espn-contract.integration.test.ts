// @vitest-environment node
import { createServer, type IncomingMessage } from 'node:http';
import { once } from 'node:events';
import EspnProvider from '../providers/espn.provider';
import { loadInsights } from '../insights/load.server';
import { getEspnCredentials, saveEspnCredentials } from '../espn-credentials.server';
import credentialModel from '../models/espn-credentials.model';

vi.mock('../models/espn-credentials.model', () => ({
  default: { findById: vi.fn(), updateOne: vi.fn() },
}));

const records = new Map<string, { encryptedCredentials?: string; onboardingComplete?: boolean }>();
const requests: { leagueId: string; views: string[]; week: number; cookie?: string }[] = [];
const league = {
  leagueId: 'workspace-123',
  providerLeagueId: '123',
  leagueName: '',
  leagueType: 1 as const,
  seasonId: 2025,
};

function player(id: number, week: number, points: number) {
  return {
    playerId: id,
    lineupSlotId: 2,
    playerPoolEntry: {
      player: {
        id,
        fullName: `Player ${id}`,
        defaultPositionId: 2,
        stats: [
          {
            scoringPeriodId: week,
            seasonId: 2025,
            statSourceId: 0,
            statSplitTypeId: 1,
            appliedTotal: points,
          },
          {
            scoringPeriodId: week,
            seasonId: 2025,
            statSourceId: 1,
            statSplitTypeId: 1,
            appliedTotal: points + 1,
          },
        ],
      },
    },
  };
}

function fixture(week: number) {
  const homePoints = 100 + week;
  const awayPoints = 90 + week;
  return {
    id: 123,
    settings: {
      name: 'Deterministic ESPN League',
      size: 2,
      scheduleSettings: {
        matchupPeriods: { '1': [1], '2': [2] },
        matchupPeriodCount: 14,
        matchupPeriodLength: 1,
        playoffTeamCount: 2,
      },
      scoringSettings: { scoringType: 'H2H_POINTS' },
    },
    status: {
      latestScoringPeriod: 3,
      finalScoringPeriod: 18,
      previousSeasons: [2024],
    },
    members: [
      { id: 'owner-a', displayName: 'Alex' },
      { id: 'owner-b', displayName: 'Blair' },
    ],
    teams: [
      {
        id: 1,
        name: 'Alpha',
        owners: ['owner-a'],
        record: { overall: { wins: 2, losses: 0, ties: 0 } },
      },
      {
        id: 2,
        name: 'Beta',
        owners: ['owner-b'],
        record: { overall: { wins: 0, losses: 2, ties: 0 } },
      },
    ],
    schedule: [
      {
        id: week,
        matchupPeriodId: week,
        playoffTierType: 'NONE',
        winner: 'HOME',
        home: {
          teamId: 1,
          totalPoints: homePoints,
          pointsByScoringPeriod: { [week]: homePoints },
          rosterForCurrentScoringPeriod: { entries: [player(10 + week, week, homePoints)] },
        },
        away: {
          teamId: 2,
          totalPoints: awayPoints,
          pointsByScoringPeriod: { [week]: awayPoints },
          rosterForCurrentScoringPeriod: { entries: [player(20 + week, week, awayPoints)] },
        },
      },
    ],
    transactions: [],
  };
}

function requestDetails(request: IncomingMessage) {
  const url = new URL(request.url || '/', 'http://fixture.test');
  const match = url.pathname.match(/\/leagues\/([^/]+)$/);
  return {
    leagueId: match?.[1] || '',
    views: url.searchParams.getAll('view'),
    week: Number(url.searchParams.get('scoringPeriodId')) || 1,
    cookie: request.headers.cookie,
  };
}

const server = createServer((request, response) => {
  const details = requestDetails(request);
  requests.push(details);
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(fixture(details.week)));
});
let apiBaseUrl = '';

beforeAll(async () => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('ESPN fixture server did not start.');
  apiBaseUrl = `http://127.0.0.1:${address.port}/apis/v3/games/ffl`;
});

afterAll(async () => {
  server.close();
  await once(server, 'close');
});

beforeEach(() => {
  requests.length = 0;
  records.clear();
  vi.stubEnv('ESPN_CREDENTIALS_KEY', 'ab'.repeat(32));
  vi.mocked(credentialModel.findById).mockImplementation(
    (owner) =>
      ({
        select: () => ({ lean: () => ({ exec: async () => records.get(String(owner)) }) }),
      }) as never,
  );
  vi.mocked(credentialModel.updateOne).mockImplementation(
    (filter, update) =>
      ({
        exec: async () => {
          const owner = String((filter as unknown as { _id: string })._id);
          const changes = update as { $set?: object };
          records.set(owner, { ...records.get(owner), ...changes.$set });
        },
      }) as never,
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it('covers ESPN validation, teams, matchups, and report loading over a local HTTP contract', async () => {
  const provider = new EspnProvider('public', apiBaseUrl);
  const info = await provider.getLeague(league, 2025);
  const teams = await provider.getTeams(league, 2025, 1);
  const matchups = await provider.getMatchups(league, 2025, 1);
  const report = await loadInsights(league, 2025, 'public', provider);

  expect(info).toMatchObject({ leagueName: 'Deterministic ESPN League', teamCount: 2 });
  expect(teams.map((team) => team.managerName)).toEqual(['Alex', 'Blair']);
  expect(matchups).toEqual([
    {
      matchupId: '1',
      homeTeamId: '1',
      awayTeamId: '2',
      homeScore: 101,
      awayScore: 91,
    },
  ]);
  expect(report.completedWeek).toBe(2);
  expect(report.scores).toHaveLength(4);
  expect(report.scores.every((score) => score.opponentTeamId)).toBe(true);
  expect(requests.length).toBeGreaterThanOrEqual(10);
  expect(requests.every((request) => request.leagueId === '123')).toBe(true);
  expect(requests.every((request) => request.cookie === undefined)).toBe(true);
  expect(requests.some((request) => request.views.includes('mSettings'))).toBe(true);
  expect(requests.some((request) => request.views.includes('mTeam'))).toBe(true);
  expect(requests.some((request) => request.views.includes('mMatchup'))).toBe(true);
  expect(requests.some((request) => request.views.includes('mBoxscore'))).toBe(true);
});

it('decrypts only the selected account credentials and attaches them to private requests', async () => {
  const ownerA = {
    espnS2: 'owner-a-secret',
    swid: '{aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa}',
  };
  const ownerB = {
    espnS2: 'owner-b-secret',
    swid: '{bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb}',
  };
  await saveEspnCredentials('owner-a', ownerA);
  await saveEspnCredentials('owner-b', ownerB);
  expect(JSON.stringify([...records.values()])).not.toContain(ownerA.espnS2);
  expect(JSON.stringify([...records.values()])).not.toContain(ownerB.espnS2);

  await Promise.all([
    new EspnProvider(await getEspnCredentials('owner-a'), apiBaseUrl).get('owner-a-league', 2025, [
      'mSettings',
    ]),
    new EspnProvider(await getEspnCredentials('owner-b'), apiBaseUrl).get('owner-b-league', 2025, [
      'mSettings',
    ]),
  ]);

  expect(requests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        leagueId: 'owner-a-league',
        cookie: `espn_s2=${ownerA.espnS2}; SWID=${ownerA.swid}`,
      }),
      expect.objectContaining({
        leagueId: 'owner-b-league',
        cookie: `espn_s2=${ownerB.espnS2}; SWID=${ownerB.swid}`,
      }),
    ]),
  );
});

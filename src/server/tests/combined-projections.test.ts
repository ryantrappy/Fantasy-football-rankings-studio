// @vitest-environment node
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  names: vi.fn(),
  sleeper: vi.fn(),
  dynasty: vi.fn(),
}));
vi.mock('axios', () => ({ default: { get: mocks.get } }));
vi.mock('../insights/load.server', () => ({ sleeperNames: mocks.names }));
vi.mock('../dynastyprocess-player-ids.server', () => ({
  loadDynastyProcessPlayerIds: mocks.dynasty,
}));
vi.mock('../live-projections.server', () => ({ sleeperLiveProjections: mocks.sleeper }));
import type { LivePlayer } from '../../live-matchups';
import { sleeperProjectionRules } from '../../combined-projections';
let api: typeof import('../combined-projections.server');
const rules = () => sleeperProjectionRules({ rush_yd: 0.1, rec_yd: 0.1, rec: 1 });
const roster = (id: string): LivePlayer[] => [
  {
    id,
    name: 'Same name',
    position: 'RB',
    owned: true,
    locked: true,
    points: 10,
    starter: true,
    projectedPoints: 13,
  },
];
beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.dynasty.mockReset().mockResolvedValue(undefined);
  api = await import('../combined-projections.server');
  mocks.names.mockResolvedValue({
    espnIds: { s1: '901', s2: '902' },
    positions: { s1: 'RB', s2: 'RB' },
  });
  mocks.sleeper.mockResolvedValue([
    {
      player_id: 's1',
      stats: { rush_yd: 100, rec_yd: 20, rec: 3 },
      capturedAt: '2026-10-03T00:00:00Z',
    },
  ]);
  mocks.get.mockResolvedValue({
    data: {
      id: 901,
      defaultPositionId: 2,
      stats: [
        {
          seasonId: 2026,
          scoringPeriodId: 4,
          statSourceId: 1,
          statSplitTypeId: 1,
          stats: { '24': 80, '42': 20, '53': 4 },
        },
      ],
    },
  });
});
it.each(['Sleeper', 'ESPN'] as const)(
  'uses both feeds for %s without another provider league and preserves ownership/locks',
  async (provider) => {
    const input = roster(provider === 'Sleeper' ? 's1' : '901');
    const result = await api.enrichPlayerProjections(input, provider, 2026, 4, rules);
    expect(result[0]).toMatchObject({
      projectedPoints: 14.5,
      projectionSpread: 1,
      projectionMethod: 'mean',
      owned: true,
      locked: true,
      points: 10,
    });
    expect(result[0].projectionSources?.map((source) => source.provider)).toEqual([
      'ESPN',
      'Sleeper',
    ]);
    expect(result[0].projectionSources?.[1].capturedAt).toBe('2026-10-03T00:00:00Z');
    expect(mocks.get.mock.calls[0][0]).toContain('/seasons/2026/players/901');
    expect(mocks.get.mock.calls[0][1].headers).toBeUndefined();
    expect(input[0].projectedPoints).toBe(13);
  },
);
it('rejects duplicate ID mappings and never joins players by their names', async () => {
  mocks.names.mockResolvedValue({
    espnIds: { s1: '901', s2: '901' },
    positions: { s1: 'RB', s2: 'RB' },
  });
  const result = await api.enrichPlayerProjections(roster('s1'), 'Sleeper', 2026, 4, rules);
  expect(result[0]).toMatchObject({ projectedPoints: 13, projectionMethod: 'native' });
  expect(result[0].projectionNote).toContain('No unique');
  expect(mocks.get).not.toHaveBeenCalled();
});
it('retains native data on source failure, incompatible scoring, wrong period and wrong position', async () => {
  mocks.get.mockRejectedValueOnce(new Error('Unavailable'));
  expect(
    (await api.enrichPlayerProjections(roster('s1'), 'Sleeper', 2026, 4, rules))[0].projectedPoints,
  ).toBe(13);
  expect(
    (await api.enrichPlayerProjections(roster('s1'), 'Sleeper', 2026, 5, rules))[0]
      .projectionMethod,
  ).toBe('native');
  const unsupported = () => sleeperProjectionRules({ rush_yd: 0.1, bonus_rush_yd_100: 3 });
  expect(
    (await api.enrichPlayerProjections(roster('s1'), 'Sleeper', 2026, 4, unsupported))[0]
      .projectionNote,
  ).toContain('unsupported');
  mocks.names.mockResolvedValue({ espnIds: { s1: '901' }, positions: { s1: 'WR' } });
  expect(
    (await api.enrichPlayerProjections(roster('s1'), 'Sleeper', 2026, 4, rules))[0].projectionNote,
  ).toContain('identity');
});
it('shares a public player cache across leagues and keeps source fetch times stable', async () => {
  const first = await api.enrichPlayerProjections(roster('s1'), 'Sleeper', 2026, 4, rules);
  const second = await api.enrichPlayerProjections(roster('901'), 'ESPN', 2026, 4, rules);
  expect(mocks.get).toHaveBeenCalledTimes(1);
  expect(first[0].projectionSources?.[0].capturedAt).toBe(
    second[0].projectionSources?.[0].capturedAt,
  );
});

const external = (pairs: [string, string][]) => ({
  revision: 'b'.repeat(40),
  updatedAt: '2026-11-20T07:36:14Z',
  bySleeper: new Map(
    pairs.map(([s]) => [s, new Set(pairs.filter(([id]) => id === s).map(([, e]) => e))]),
  ),
  byEspn: new Map(
    pairs.map(([, e]) => [e, new Set(pairs.filter(([, id]) => id === e).map(([s]) => s))]),
  ),
});

it.each(['Sleeper', 'ESPN'] as const)(
  'fills an ID gap when the selected league is %s',
  async (provider) => {
    mocks.names.mockResolvedValue({ espnIds: { s2: '902' }, positions: { s1: 'RB', s2: 'RB' } });
    const input = roster(provider === 'Sleeper' ? 's1' : '901');
    const [without] = await api.enrichPlayerProjections(input, provider, 2026, 4, rules);
    expect(without.projectionIdentity).toBeUndefined();
    expect(without.projectedPoints).toBe(13);

    const snapshot = external([['s1', '901']]);
    mocks.dynasty.mockResolvedValue(snapshot);
    const [withFallback] = await api.enrichPlayerProjections(input, provider, 2026, 4, rules);
    expect(withFallback).toMatchObject({
      projectionMethod: 'mean',
      projectedPoints: 14.5,
      projectionIdentity: {
        source: 'DynastyProcess',
        revision: snapshot.revision,
        updatedAt: snapshot.updatedAt,
      },
    });
    expect(withFallback.projectionNote).toContain('DynastyProcess');
  },
);

it('keeps existing catalogue links and excludes conflicting or ambiguous external links', async () => {
  mocks.names.mockResolvedValue({
    espnIds: { s1: '901', s2: '902' },
    positions: { s1: 'RB', s2: 'RB', s3: 'RB', s4: 'RB', s5: 'RB' },
  });
  mocks.dynasty.mockResolvedValue(
    external([
      ['s1', '900'],
      ['s3', '902'],
      ['s4', '903'],
      ['s4', '904'],
      ['s5', '904'],
    ]),
  );
  const result = await api.enrichPlayerProjections(
    ['s1', 's3', 's4', 's5'].flatMap(roster),
    'Sleeper',
    2026,
    4,
    rules,
  );
  expect(result[0].projectionIdentity).toEqual({ source: 'Sleeper catalog' });
  expect(result[0].projectionMethod).toBe('mean');
  for (const player of result.slice(1)) {
    expect(player.projectedPoints).toBe(13);
    expect(player.projectionIdentity).toBeUndefined();
    expect(player.projectionNote).toContain('Conflicting or duplicate');
  }
  expect(mocks.get).toHaveBeenCalledTimes(1);
});

it('reports additional matching coverage even when league scoring prevents blending', async () => {
  mocks.names.mockResolvedValue({ espnIds: {}, positions: { s1: 'RB' } });
  mocks.dynasty.mockResolvedValue(external([['s1', '901']]));
  const [player] = await api.enrichPlayerProjections(roster('s1'), 'Sleeper', 2026, 4, () =>
    sleeperProjectionRules({ rush_yd: 0.1, bonus_rush_yd_100: 3 }),
  );
  expect(player.projectionIdentity?.source).toBe('DynastyProcess');
  expect(player.projectedPoints).toBe(13);
  expect(player.projectionNote).toContain('scoring unsupported');
  expect(mocks.get).not.toHaveBeenCalled();
});

import { adviseLineup } from './lineup-advisor';
import { sleeperTradeRules, type LiveLeague, type LivePlayer } from './live-matchups';
import { suggestTrades } from './trade-suggestions';
import type { ManagedTeamSelection } from './types';

const player = (id: string, position: string, projectedPoints: number): LivePlayer => ({
  id,
  name: `Player ${id}`,
  position,
  projectedPoints,
  starter: false,
  points: null,
  owned: true,
  locked: false,
  bye: false,
  availability: null,
});
const selection = (): ManagedTeamSelection => ({
  teamId: '1',
  needsReselection: false,
  teams: [
    { teamId: '1', teamName: 'One', managerName: 'A' },
    { teamId: '2', teamName: 'Two', managerName: 'B' },
  ],
});
function league(): LiveLeague {
  return {
    leagueId: '100',
    leagueName: 'League',
    provider: 'Sleeper',
    season: 2026,
    week: 5,
    capturedAt: '2026-10-06T15:00:00Z',
    lineupSlots: ['RB', 'WR'],
    matchups: [
      {
        id: 'm',
        home: {
          teamId: '1',
          name: 'One',
          score: null,
          players: [player('101', 'RB', 20), player('102', 'RB', 18), player('103', 'WR', 5)],
        },
        away: {
          teamId: '2',
          name: 'Two',
          score: null,
          players: [player('201', 'WR', 22), player('202', 'WR', 17), player('203', 'RB', 6)],
        },
      },
    ],
  };
}

it('ranks useful benefit for both teams ahead of one-sided gains and bench totals', () => {
  const snapshot = league();
  snapshot.matchups[0].home.players.push(player('104', 'QB', 999));
  const original = JSON.stringify(snapshot);
  const result = suggestTrades(snapshot, selection());
  expect(result.reason).toBeUndefined();
  expect(result.suggestions[0]).toMatchObject({
    send: { id: '102' },
    receive: { id: '202' },
    counterpart: { name: 'Two' },
  });
  expect(
    result.suggestions[0].sides.map((side) => [side.before, side.after, side.difference]),
  ).toEqual([
    [25, 37, 12],
    [28, 40, 12],
  ]);
  expect(result.suggestions[0].sides[0].beforeCoverage).toContainEqual({
    position: 'RB',
    count: 2,
  });
  expect(result.suggestions[0].sides[0].coverage).toContainEqual({ position: 'WR', count: 2 });
  expect(
    result.suggestions.every((offer) => offer.sides.every((side) => side.difference! > 0)),
  ).toBe(true);
  expect(result.suggestions.some((offer) => offer.send.id === '104')).toBe(false);
  expect(JSON.stringify(snapshot)).toBe(original);
});

it('bounds and deduplicates results, including teams repeated in matchups', () => {
  const snapshot = league();
  snapshot.matchups[0].home.players.push(player('104', 'RB', 17), player('105', 'RB', 16));
  snapshot.matchups[0].away!.players.push(player('204', 'WR', 16));
  const expected = suggestTrades(snapshot, selection());
  expect(expected.evaluated).toBeGreaterThan(5);
  expect(expected.suggestions).toHaveLength(5);
  snapshot.matchups.push(snapshot.matchups[0]);
  const actual = suggestTrades(snapshot, selection());
  expect(actual.suggestions.map((offer) => offer.id)).toEqual(
    expected.suggestions.map((offer) => offer.id),
  );
  expect(new Set(actual.suggestions.map((offer) => offer.id)).size).toBe(5);
});

it.each([{ teamId: null }, { teamId: 'missing' }, { needsReselection: true }, { teams: [] }])(
  'requires a validated managed team (%j)',
  (changes) => {
    const result = suggestTrades(league(), { ...selection(), ...changes });
    expect(result.suggestions).toEqual([]);
    expect(result.reason).toMatch(/Choose and save/);
  },
);

it('keeps roster ownership isolated and rejects ambiguous identities', () => {
  const snapshot = league();
  snapshot.matchups[0].away!.players[0].id = '101';
  expect(suggestTrades(snapshot, selection()).reason).toMatch(/ownership is ambiguous/);
  snapshot.matchups[0].away!.players[0].owned = false;
  expect(
    suggestTrades(snapshot, selection()).suggestions.every((offer) => offer.receive.id !== '101'),
  ).toBe(true);
});

it.each([
  { reserve: true },
  { owned: false },
  { locked: true },
  { locked: undefined },
  { bye: true },
  { bye: undefined },
  { availability: 'OUT' },
  { availability: 'QUESTIONABLE' },
  { availability: 'DOUBTFUL' },
  { availability: undefined },
])('excludes ineligible and unavailable exchange assets (%j)', (changes) => {
  const snapshot = league();
  Object.assign(snapshot.matchups[0].home.players[1], changes);
  expect(
    suggestTrades(snapshot, selection()).suggestions.every((offer) => offer.send.id !== '102'),
  ).toBe(true);
});

it.each([undefined, NaN, Infinity])('does not rank incomplete projections (%s)', (points) => {
  const snapshot = league();
  snapshot.matchups[0].home.players[1].projectedPoints = points;
  expect(suggestTrades(snapshot, selection()).reason).toMatch(/coverage is unavailable/);
  snapshot.matchups[0].home.players[1].projectedPoints = 18;
  snapshot.matchups[0].away!.players[1].projectedPoints = points;
  const result = suggestTrades(snapshot, selection());
  expect(result.suggestions).toEqual([]);
  expect(result.incomplete).toBe(1);
  expect(result.notices.join(' ')).toMatch(/skipped/);
});

it('reports unsupported identities and lineup rules instead of treating them as cheap assets', () => {
  const snapshot = league();
  snapshot.matchups[0].home.players[1].id = 'draft-pick';
  expect(suggestTrades(snapshot, selection()).reason).toMatch(/identity/);
  snapshot.matchups[0].home.players[1].id = '102';
  for (const slots of [undefined, ['Unsupported slot 25']]) {
    snapshot.lineupSlots = slots;
    expect(suggestTrades(snapshot, selection()).reason).toMatch(/lineup rules/);
  }
});

it('returns an explicit empty result for one-sided and irrelevant offers', () => {
  const snapshot = league();
  snapshot.lineupSlots = ['RB'];
  expect(suggestTrades(snapshot, selection()).suggestions).toEqual([]);
});

it.each(['FLEX', 'SUPER FLEX'])('uses legal %s assignment for both exchanged rosters', (flex) => {
  const snapshot = league();
  snapshot.lineupSlots!.push(flex);
  snapshot.matchups[0].home.players.push(player('104', 'RB', 16));
  snapshot.matchups[0].away!.players.push(player('204', flex === 'FLEX' ? 'WR' : 'QB', 16));
  const offers = suggestTrades(snapshot, selection()).suggestions;
  expect(offers.length).toBeGreaterThan(0);
  for (const offer of offers) {
    const home = snapshot.matchups[0].home;
    const away = snapshot.matchups[0].away!;
    for (const [side, team, outgoing, incoming] of [
      [0, home, offer.send, offer.receive],
      [1, away, offer.receive, offer.send],
    ] as const) {
      const roster = [...team.players.filter((entry) => entry.id !== outgoing.id), incoming];
      const optimized = adviseLineup(roster, snapshot.lineupSlots);
      expect(optimized.assignment).toHaveLength(3);
      expect(new Set(optimized.assignment.map((entry) => entry.player.id)).size).toBe(3);
      expect(optimized.proposed).toBe(offer.sides[side].after);
    }
  }
});

it('honors provider-specific eligible slots', () => {
  const snapshot = league();
  snapshot.provider = 'ESPN';
  // A mismatched explicit provider rule must not be overridden by the position label.
  snapshot.matchups[0].away!.players.forEach((entry) => {
    entry.eligibleSlots = ['RB'];
  });
  expect(suggestTrades(snapshot, selection()).suggestions).toEqual([]);
});

it('blocks known disabled trading and expired deadlines and discloses review timing', () => {
  const snapshot = league();
  snapshot.tradeRules = { disabled: true };
  expect(suggestTrades(snapshot, selection()).reason).toMatch(/disabled/);
  snapshot.tradeRules = { deadlinePassed: true };
  expect(suggestTrades(snapshot, selection()).reason).toMatch(/deadline has passed/);
  snapshot.tradeRules = { deadlineWeek: 10, reviewDays: 2 };
  const result = suggestTrades(snapshot, selection());
  expect(result.suggestions.length).toBeGreaterThan(0);
  expect(result.notices.join(' ')).toMatch(/Week 10/);
  expect(result.notices.join(' ')).toMatch(/2 days/);
});

it('derives Sleeper deadlines conservatively around the last game and unknown settings', () => {
  const settings = { trade_deadline: 10, trade_review_days: 2, disable_trades: 0 };
  expect(sleeperTradeRules(settings, 9).deadlinePassed).toBe(false);
  expect(sleeperTradeRules(settings, 11).deadlinePassed).toBe(true);
  expect(
    sleeperTradeRules(
      settings,
      10,
      new Map([
        ['a', 0],
        ['b', 1],
      ]),
    ).deadlinePassed,
  ).toBe(false);
  expect(
    sleeperTradeRules(
      settings,
      10,
      new Map([
        ['a', 0],
        ['b', 0],
      ]),
    ).deadlinePassed,
  ).toBe(true);
  expect(sleeperTradeRules(settings, 10, new Map()).deadlinePassed).toBe(false);
  expect(sleeperTradeRules({}, 10).deadlineWeek).toBeUndefined();
  expect(sleeperTradeRules({}, 10).disabled).toBeUndefined();
  expect(sleeperTradeRules({ disable_trades: 99 }, 10).disabled).toBeUndefined();
  expect(sleeperTradeRules({ trade_deadline: 99 }, 10).deadlineWeek).toBeUndefined();
});

it('evaluates a twelve-team league with full rosters and nine starting slots', () => {
  const snapshot = league();
  const positions = [
    'QB',
    'QB',
    'RB',
    'RB',
    'RB',
    'RB',
    'RB',
    'WR',
    'WR',
    'WR',
    'WR',
    'WR',
    'TE',
    'TE',
    'K',
    'DST',
  ];
  snapshot.lineupSlots = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DST'];
  snapshot.matchups = Array.from({ length: 12 }, (_, index) => ({
    id: `m${index}`,
    home: {
      teamId: String(index + 1),
      name: `Team ${index + 1}`,
      score: null,
      players: positions.map((position, slot) =>
        player(
          String(1000 + index * 100 + slot),
          position,
          15 - slot * 0.2 + (position === (index % 2 ? 'WR' : 'RB') ? 10 : 0),
        ),
      ),
    },
    away: null,
  }));
  const result = suggestTrades(snapshot, selection());
  expect(result.reason).toBeUndefined();
  expect(result.suggestions).toHaveLength(5);
  expect(
    result.suggestions.every((offer) => offer.sides.every((side) => side.difference! > 0)),
  ).toBe(true);
});

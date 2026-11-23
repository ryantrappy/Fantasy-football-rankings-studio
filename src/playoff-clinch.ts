import { bestSeedingCandidates, type PlayoffRules, type StandingsState } from './playoff-rules';

export type PlayoffClinch =
  | { status: 'wins-needed'; wins: number }
  | { status: 'clinched' | 'needs-help' | 'eliminated' | 'unavailable' };

type Fixture = [home: number, away: number];

const unavailable: PlayoffClinch = { status: 'unavailable' };
const searchLimit = 200_000;

// Scores from future games are unknown. At the first unresolved scoring
// tiebreaker, consider every remaining candidate for the seed.
export function* playoffClinch(
  teamIds: string[],
  size: number,
  initial: StandingsState,
  rules: PlayoffRules | undefined,
  schedule: Fixture[] | undefined,
): Generator<void, PlayoffClinch[]> {
  if (!rules || !schedule) return teamIds.map(() => unavailable);
  const fixtures = schedule;

  const teams = teamIds.map((_, i) => i);
  const divisions = teamIds.map((id) => rules.divisionByTeam[id]);
  const divisionPools = rules.divisionWinnersFirst
    ? [...new Set(divisions)].map((division) => teams.filter((i) => divisions[i] === division))
    : [];
  const ownDivision = teams.map((i) => divisionPools.find((pool) => pool.includes(i)));
  const extraBerths = Math.max(0, divisionPools.length - 1);
  const state = {
    ...initial,
    wins: [...initial.wins],
    meetings: initial.meetings.map((row) => [...row]),
    headToHead: initial.headToHead.map((row) => [...row]),
  };
  const remaining = teams.map(() => 0);
  const addedWins = teams.map(() => 0);
  const mostWinsWhileMissing = teams.map(() => -1);
  const canQualify = teams.map(() => false);
  const unfinished = new Set<number>();
  for (const [a, b] of fixtures) {
    remaining[a]++;
    remaining[b]++;
    state.meetings[a][b]++;
    state.meetings[b][a]++;
  }
  const totalGames = [...remaining];
  let visited = 0;

  const candidates = (pool: number[]) =>
    bestSeedingCandidates(pool, state, divisions, rules.tiebreakers, fixtures.length === 0);

  // Each possible division-winner combination is followed by wildcard seeding.
  // At the last seed, every tied candidate is possible and only a sole candidate
  // is guaranteed. Recording those together avoids exploring redundant seeds.
  function* evaluate(
    selected: number[],
    pool: number[],
    division: number,
    unresolved: number[],
  ): Generator<void> {
    if (visited >= searchLimit) {
      unresolved.forEach((i) => unfinished.add(i));
      return;
    }
    if (++visited % 128 === 0) yield;
    if (division < divisionPools.length) {
      for (const winner of candidates(divisionPools[division]))
        yield* evaluate(
          [...selected, winner],
          pool.filter((i) => i !== winner),
          division + 1,
          unresolved,
        );
      return;
    }
    const left = size - selected.length;
    const next = left > 0 ? candidates(pool) : [];
    if (left > 1) {
      for (const winner of next)
        yield* evaluate(
          [...selected, winner],
          pool.filter((i) => i !== winner),
          division,
          unresolved,
        );
      return;
    }
    for (const i of unresolved) {
      if (selected.includes(i) || next.includes(i)) canQualify[i] = true;
      if (!selected.includes(i) && (next.length !== 1 || next[0] !== i))
        mostWinsWhileMissing[i] = Math.max(mostWinsWhileMissing[i], addedWins[i]);
    }
  }

  function* visit(index: number, pending: number[]): Generator<void> {
    if (visited >= searchLimit) {
      pending.forEach((i) => unfinished.add(i));
      return;
    }
    if (++visited % 128 === 0) yield;
    const unresolved = pending.filter((i) => {
      const possibleWins = addedWins[i] + remaining[i];
      if (canQualify[i] && possibleWins <= mostWinsWhileMissing[i]) return false;
      const floor = state.wins[i];
      const ceiling = floor + remaining[i];
      const division = ownDivision[i];
      const divisionSafe = division?.every((j) => j === i || state.wins[j] + remaining[j] < floor);
      const threats = teams.filter((j) => j !== i && state.wins[j] + remaining[j] >= floor);
      if (divisionSafe || threats.length + extraBerths < size) {
        canQualify[i] = true;
        return false;
      }
      const divisionLost = !division || division.some((j) => state.wins[j] > ceiling);
      if (divisionLost && teams.filter((j) => state.wins[j] > ceiling).length >= size) {
        mostWinsWhileMissing[i] = Math.max(mostWinsWhileMissing[i], possibleWins);
        return false;
      }
      return true;
    });
    if (unresolved.length === 0) return;
    const fixture = fixtures[index];
    if (!fixture) {
      yield* evaluate([], teams, 0, unresolved);
      return;
    }
    const [a, b] = fixture;
    remaining[a]--;
    remaining[b]--;
    for (const outcome of [1, 0, 0.5]) {
      const away = 1 - outcome;
      state.wins[a] += outcome;
      state.wins[b] += away;
      state.headToHead[a][b] += outcome;
      state.headToHead[b][a] += away;
      if (outcome === 1) addedWins[a]++;
      if (away === 1) addedWins[b]++;
      yield* visit(index + 1, unresolved);
      if (outcome === 1) addedWins[a]--;
      if (away === 1) addedWins[b]--;
      state.wins[a] -= outcome;
      state.wins[b] -= away;
      state.headToHead[a][b] -= outcome;
      state.headToHead[b][a] -= away;
    }
    remaining[a]++;
    remaining[b]++;
  }

  yield* visit(0, teams);
  return teams.map((i) => {
    const miss = mostWinsWhileMissing[i];
    if (miss === totalGames[i] && canQualify[i]) return { status: 'needs-help' };
    if (unfinished.has(i)) return unavailable;
    if (!canQualify[i]) return { status: 'eliminated' };
    if (miss === -1) return { status: 'clinched' };
    return { status: 'wins-needed', wins: miss + 1 };
  });
}

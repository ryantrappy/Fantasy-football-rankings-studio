export type SeedingTiebreaker =
  | 'head-to-head'
  | 'points-for'
  | 'division-record'
  | 'points-against';

export interface PlayoffRules {
  provider: 'ESPN' | 'Sleeper';
  season: number;
  tiebreakers: SeedingTiebreaker[];
  divisionByTeam: Record<string, string>;
  divisionWinnersFirst: boolean;
  roundWeeks: number[][];
  reseed: boolean;
  unsupportedReason?: string;
}

export interface StandingsState {
  wins: number[];
  points: number[];
  against: number[];
  // Directed matrices: games and win-equivalents (a tied game counts as half a win).
  meetings: number[][];
  headToHead: number[][];
}

// Resolve one seed at a time. Recompute head-to-head on the remaining tied cohort,
// rather than using a pairwise sort comparator (which can be non-transitive).
export function seedPlayoffTeams(
  teamIds: string[],
  size: number,
  state: StandingsState,
  rules: PlayoffRules | undefined,
  randomTie: number[],
): number[] {
  const divisions = teamIds.map((id) => rules?.divisionByTeam[id]);
  const pick = (pool: number[]) => {
    const bestWins = Math.max(...pool.map((j) => state.wins[j]));
    let tied = pool.filter((i) => state.wins[i] === bestWins);
    for (const rule of rules?.tiebreakers ?? ['points-for']) {
      if (tied.length < 2) break;
      let values: number[];
      if (rule === 'head-to-head') {
        const counts = tied.flatMap((i) =>
          tied.filter((j) => j !== i).map((j) => state.meetings[i][j]),
        );
        // All tied teams must have met each other equally often, with at least one game.
        if (!counts[0] || counts.some((n) => n !== counts[0])) continue;
        values = tied.map((i) => tied.reduce((sum, j) => sum + state.headToHead[i][j], 0));
      } else if (rule === 'division-record') {
        if (!divisions[tied[0]] || tied.some((i) => divisions[i] !== divisions[tied[0]])) continue;
        const games = tied.map((i) =>
          teamIds.reduce(
            (sum, _, j) =>
              sum + (i !== j && divisions[j] === divisions[i] ? state.meetings[i][j] : 0),
            0,
          ),
        );
        if (games.some((n) => n === 0)) continue;
        values = tied.map(
          (i, k) =>
            teamIds.reduce(
              (sum, _, j) =>
                sum + (i !== j && divisions[j] === divisions[i] ? state.headToHead[i][j] : 0),
              0,
            ) / games[k],
        );
      } else values = tied.map((i) => (rule === 'points-for' ? state.points[i] : state.against[i]));
      const best = Math.max(...values);
      tied = tied.filter((_, k) => values[k] === best);
    }
    return tied.reduce((best, i) => (randomTie[i] > randomTie[best] ? i : best));
  };
  const order = (pool: number[], count: number) => {
    const result: number[] = [];
    while (pool.length && result.length < count) {
      const winner = pick(pool);
      result.push(winner);
      pool = pool.filter((i) => i !== winner);
    }
    return result;
  };
  const all = teamIds.map((_, i) => i);
  if (!rules?.divisionWinnersFirst) return order(all, size);
  const winners = [...new Set(divisions)].map((division) =>
    pick(all.filter((i) => divisions[i] === division)),
  );
  const first = order(winners, size);
  return [
    ...first,
    ...order(
      all.filter((i) => !first.includes(i)),
      size - first.length,
    ),
  ];
}

export function playoffRulesReason(
  teamIds: string[],
  size: number,
  end: number,
  rules?: PlayoffRules,
) {
  if (!rules) return undefined; // Legacy saved reports retain their explicitly labeled scenario.
  if (rules.unsupportedReason) return rules.unsupportedReason;
  if (
    !rules.tiebreakers.length ||
    rules.tiebreakers.some(
      (r) => !['head-to-head', 'points-for', 'division-record', 'points-against'].includes(r),
    )
  )
    return 'The season’s playoff seeding tiebreaker is unavailable or unsupported.';
  if (
    rules.divisionWinnersFirst &&
    (teamIds.some((id) => !rules.divisionByTeam[id]) ||
      new Set(teamIds.map((id) => rules.divisionByTeam[id])).size > size)
  )
    return 'The season’s division assignments or division playoff places are unsupported.';
  const weeks = rules.roundWeeks.flat();
  if (
    rules.roundWeeks.length !== Math.ceil(Math.log2(size)) ||
    rules.roundWeeks.some((round) => !round.length) ||
    weeks.some((week, i) => !Number.isInteger(week) || week !== end + 1 + i || week > 18)
  )
    return 'The season’s playoff round schedule is unavailable or unsupported.';
  return undefined;
}

export function describePlayoffRules(rules?: PlayoffRules): string {
  if (!rules)
    return 'Legacy scenario: league-wide wins, then points; single-week rounds and a fixed bracket. Season-specific rules are unavailable in this saved report.';
  if (rules.unsupportedReason) return rules.unsupportedReason;
  const names = {
    'head-to-head': 'head-to-head record',
    'points-for': 'points scored',
    'division-record': 'division record',
    'points-against': 'points against',
  };
  return `${rules.provider} ${rules.season} rules: ${rules.divisionWinnersFirst ? 'division winners receive the top seeds; remaining places use overall record' : 'overall record determines seeding'}. Tiebreakers: ${rules.tiebreakers.map((r) => names[r]).join(', then ')}, then coin flip. Playoff rounds: ${rules.roundWeeks.map((w) => `weeks ${w.join('–')}`).join('; ')}. ${rules.reseed ? 'Survivors are reseeded each round.' : 'Fixed bracket.'}`;
}

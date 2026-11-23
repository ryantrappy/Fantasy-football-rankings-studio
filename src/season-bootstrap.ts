export interface BootstrapPlayer {
  id: string;
  name: string;
  position: string;
  slots: number[];
  scores: number[];
}

export interface BootstrapTeam {
  id: string;
  name: string;
  players: BootstrapPlayer[];
}

type Game = [home: number, away: number | null];

export interface BootstrapLeague {
  teams: BootstrapTeam[];
  slotCount: number;
  weeks: number;
  schedule?: Game[][];
}

export interface BootstrapOptions {
  trials: number;
  seed: number;
  schedule: 'random' | 'league';
  lineup: 'best-ball' | 'managed';
  remove?: { teamId: string; playerId: string };
}

export interface BootstrapResult {
  options: BootstrapOptions;
  weeks: number;
  teams: {
    id: string;
    name: string;
    wins: number;
    allPlay: number;
    points: number;
    pointsAgainst: number;
    optimalPoints: number;
    finish: number;
    winCounts: { wins: number; count: number }[];
    finishCounts: number[];
  }[];
  removal?: { teamId: string; playerId: string; wins: number; points: number };
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(array: T[], random: () => number) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function roundRobin(size: number) {
  const order: (number | null)[] = Array.from({ length: size }, (_, i) => i);
  if (size % 2) order.push(null);
  return Array.from({ length: order.length - 1 }, () => {
    const round: Game[] = [];
    for (let i = 0; i < order.length / 2; i++) {
      const a = order[i];
      const b = order[order.length - i - 1];
      round.push(a === null ? [b!, null] : [a, b]);
    }
    order.splice(1, 0, order.pop()!);
    return round;
  });
}

// Eligible player sets form a transversal matroid. Visiting players by descending
// score and keeping each one that can be matched yields a maximum-weight lineup.
// The augmenting path can move a player out of a flex slot to make room.
export function bootstrapLineup(
  players: BootstrapPlayer[],
  scores: number[],
  slotCount: number,
  omit = -1,
) {
  const assigned = new Int32Array(slotCount).fill(-1);
  const visited = new Int32Array(slotCount);
  function match(player: number, attempt: number): boolean {
    for (const slot of players[player].slots) {
      if (visited[slot] === attempt) continue;
      visited[slot] = attempt;
      if (assigned[slot] === -1 || match(assigned[slot], attempt)) {
        assigned[slot] = player;
        return true;
      }
    }
    return false;
  }
  const order = scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
  let filled = 0;
  let points = 0;
  for (const [index, player] of order.entries()) {
    if (player === omit || !match(player, index + 1)) continue;
    points += scores[player];
    if (++filled === slotCount) break;
  }
  return { points, filled };
}

const win = (score: number, opponent: number) =>
  score > opponent ? 1 : score === opponent ? 0.5 : 0;

export const bootstrapModelVersion = 'league-positional-bootstrap-v1';

export function* simulateBootstrapSeasons(
  league: BootstrapLeague,
  options: BootstrapOptions,
): Generator<number, BootstrapResult> {
  const { teams, slotCount, weeks, schedule } = league;
  if (
    teams.length < 2 ||
    teams.length > 32 ||
    slotCount < 1 ||
    slotCount > 24 ||
    !Number.isInteger(weeks) ||
    weeks < 1 ||
    weeks > 18 ||
    !Number.isInteger(options.trials) ||
    options.trials < 1 ||
    options.trials > 1000 ||
    !Number.isInteger(options.seed) ||
    options.seed < 0 ||
    options.seed > 0xffffffff
  )
    throw new Error('This simulation needs a supported league, trial count, and seed.');
  if (options.schedule === 'league' && schedule?.length !== weeks)
    throw new Error('The full verified league schedule is unavailable.');
  const removalTeam = teams.findIndex((team) => team.id === options.remove?.teamId);
  const removalPlayer =
    teams[removalTeam]?.players.findIndex((player) => player.id === options.remove?.playerId) ?? -1;
  if (options.remove && removalPlayer < 0) throw new Error('The selected player is unavailable.');

  const random = seededRandom(options.seed);
  const scheduleRandom = seededRandom(options.seed ^ 0x9e3779b9);
  const efficiencyRandom = seededRandom(options.seed ^ 0x85ebca6b);
  const baseRounds = roundRobin(teams.length);
  const index = teams.map((_, i) => i);
  const totals = teams.map((team) => ({
    id: team.id,
    name: team.name,
    wins: 0,
    allPlay: 0,
    points: 0,
    pointsAgainst: 0,
    optimalPoints: 0,
    finish: 0,
    winCounts: new Map<number, number>(),
    finishCounts: teams.map(() => 0),
  }));
  let removalWins = 0;
  let removalPoints = 0;
  for (let trial = 0; trial < options.trials; trial++) {
    const rounds =
      options.schedule === 'league'
        ? schedule!
        : (() => {
            const order = shuffled(index, scheduleRandom);
            const roundOrder = shuffled(baseRounds, scheduleRandom);
            return Array.from({ length: weeks }, (_, week) =>
              roundOrder[week % roundOrder.length].map(([a, b]): Game => [
                order[a],
                b === null ? null : order[b],
              ]),
            );
          })();
    const wins = teams.map(() => 0);
    const points = teams.map(() => 0);

    for (const games of rounds) {
      let changedScore = 0;
      const scores = teams.map((team, i) => {
        const sampled = team.players.map(
          (player) => player.scores[Math.floor(random() * player.scores.length)],
        );
        const optimal = bootstrapLineup(team.players, sampled, slotCount).points;
        // Approximate a normal 77.5% ± 5pp lineup efficiency with a bounded draw.
        const efficiency =
          options.lineup === 'best-ball'
            ? 1
            : Math.max(
                0,
                Math.min(
                  1,
                  0.775 +
                    0.05 *
                      Math.sqrt(-2 * Math.log(1 - efficiencyRandom())) *
                      Math.cos(2 * Math.PI * efficiencyRandom()),
                ),
              );
        const score = optimal * efficiency;
        totals[i].optimalPoints += optimal;
        points[i] += score;
        if (i === removalTeam) {
          changedScore =
            bootstrapLineup(team.players, sampled, slotCount, removalPlayer).points * efficiency;
          removalPoints += changedScore - score;
        }
        return score;
      });
      for (const [a, b] of games) {
        if (b === null) continue;
        const result = win(scores[a], scores[b]);
        wins[a] += result;
        wins[b] += 1 - result;
        totals[a].pointsAgainst += scores[b];
        totals[b].pointsAgainst += scores[a];
        if (a === removalTeam) removalWins += win(changedScore, scores[b]) - result;
        if (b === removalTeam) removalWins += win(changedScore, scores[a]) - (1 - result);
      }
      for (const i of index)
        for (const j of index) if (i !== j) totals[i].allPlay += win(scores[i], scores[j]);
      yield trial;
    }

    // Rank by head-to-head wins and total points. Exact ties share the same finish.
    const standings = [...index].sort((a, b) => wins[b] - wins[a] || points[b] - points[a]);
    let finish = 1;
    for (const [place, i] of standings.entries()) {
      const previous = standings[place - 1];
      if (place === 0 || wins[i] !== wins[previous] || points[i] !== points[previous])
        finish = place + 1;
      const total = totals[i];
      total.wins += wins[i];
      total.points += points[i];
      total.finish += finish;
      total.finishCounts[finish - 1]++;
      total.winCounts.set(wins[i], (total.winCounts.get(wins[i]) ?? 0) + 1);
    }
  }
  const perTrial = (value: number) => value / options.trials;
  return {
    options,
    weeks,
    teams: totals.map((team) => ({
      ...team,
      wins: perTrial(team.wins),
      allPlay: perTrial(team.allPlay) / (weeks * (teams.length - 1)),
      points: perTrial(team.points),
      pointsAgainst: perTrial(team.pointsAgainst),
      optimalPoints: perTrial(team.optimalPoints),
      finish: perTrial(team.finish),
      winCounts: [...team.winCounts]
        .sort(([a], [b]) => a - b)
        .map(([wins, count]) => ({ wins, count })),
    })),
    removal: options.remove && {
      ...options.remove,
      wins: perTrial(removalWins),
      points: perTrial(removalPoints),
    },
  };
}

export async function runBootstrapSeasons(
  league: BootstrapLeague,
  options: BootstrapOptions,
  onProgress: (completed: number) => void,
  signal: AbortSignal,
) {
  const run = simulateBootstrapSeasons(league, options);
  let reported = 0;
  for (;;) {
    signal.throwIfAborted();
    const deadline = performance.now() + 4;
    do {
      const step = run.next();
      if (step.done) return step.value;
      if (step.value - reported >= Math.max(1, Math.ceil(options.trials / 20))) {
        reported = step.value;
        onProgress(reported);
        signal.throwIfAborted();
      }
    } while (performance.now() < deadline);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

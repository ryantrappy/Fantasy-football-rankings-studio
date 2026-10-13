import type { ScoreWeek } from '../../insights';
export interface VerifiedPlayoffGame {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  weeks: number[];
  homePoints: number;
  awayPoints: number;
  elimination: boolean;
}
interface Bracket {
  m?: number;
  r?: number;
  p?: number;
  t1?: unknown;
  t2?: unknown;
  w?: number | null;
  l?: number | null;
  t1_from?: { w?: number; l?: number };
  t2_from?: { w?: number; l?: number };
}
function scored(
  id: string,
  a: string,
  b: string,
  weeks: number[],
  scores: ScoreWeek[],
  completedWeek: number,
  elimination: boolean,
): VerifiedPlayoffGame | undefined {
  if (
    !weeks.length ||
    weeks.some((w) => !Number.isInteger(w) || w < 1 || w > completedWeek) ||
    new Set(weeks).size !== weeks.length ||
    a === b
  )
    return;
  let homePoints = 0,
    awayPoints = 0;
  for (const week of weeks) {
    const own = scores.filter((s) => s.week === week && s.teamId === a),
      other = scores.filter((s) => s.week === week && s.teamId === b);
    if (
      own.length !== 1 ||
      other.length !== 1 ||
      !Number.isFinite(own[0].actual) ||
      !Number.isFinite(other[0].actual)
    )
      return;
    homePoints += own[0].actual;
    awayPoints += other[0].actual;
  }
  return { id, homeTeamId: a, awayTeamId: b, weeks, homePoints, awayPoints, elimination };
}
export function sleeperPlayoffGames(
  bracket: Bracket[],
  roundWeeks: number[][],
  scores: ScoreWeek[],
  completedWeek: number,
) {
  const final = bracket.find((m) => m.p === 1);
  if (!final) return undefined;
  const path: Bracket[] = [];
  const seen = new Set<Bracket>();
  function visit(m: Bracket) {
    if (seen.has(m)) return;
    seen.add(m);
    path.push(m);
    for (const from of [m.t1_from, m.t2_from]) {
      if (from?.w != null) {
        const prior = bracket.find((p) => p.m === from.w);
        if (prior) visit(prior);
      }
    }
  }
  visit(final);
  if (
    path.some(
      (m) =>
        !m.r ||
        !roundWeeks[m.r - 1]?.length ||
        roundWeeks[m.r - 1].some((w) => !Number.isInteger(w) || w < 1),
    )
  )
    return undefined;
  return path.flatMap((m) => {
    if (
      typeof m.t1 !== 'number' ||
      typeof m.t2 !== 'number' ||
      !m.w ||
      !m.l ||
      !m.r ||
      m.r < 1 ||
      m.w === m.l ||
      ![m.t1, m.t2].includes(m.w) ||
      ![m.t1, m.t2].includes(m.l)
    )
      return [];
    const g = scored(
      `sleeper:${m.m ?? `${m.r}:${m.t1}:${m.t2}`}`,
      String(m.t1),
      String(m.t2),
      roundWeeks[m.r - 1] ?? [],
      scores,
      completedWeek,
      true,
    );
    return g ? [g] : [];
  });
}
export function espnPlayoffGames(
  schedule: {
    playoffTierType?: string;
    matchupPeriodId?: number;
    home?: { teamId: number };
    away?: { teamId: number };
  }[],
  periods: Record<string, number[]> | undefined,
  scores: ScoreWeek[],
  completedWeek: number,
) {
  const bracket = schedule.filter((m) => m.playoffTierType === 'WINNERS_BRACKET');
  if (
    !bracket.length ||
    bracket.some(
      (m) =>
        m.matchupPeriodId == null ||
        !periods?.[String(m.matchupPeriodId)]?.length ||
        periods[String(m.matchupPeriodId)].some((w) => !Number.isInteger(w) || w < 1),
    )
  )
    return undefined;
  return bracket.flatMap((m) => {
    if (m.playoffTierType !== 'WINNERS_BRACKET' || !m.home || !m.away || m.matchupPeriodId == null)
      return [];
    const a = String(m.home.teamId),
      b = String(m.away.teamId);
    const g = scored(
      `espn:${m.matchupPeriodId}:${a}:${b}`,
      a,
      b,
      periods?.[String(m.matchupPeriodId)] ?? [],
      scores,
      completedWeek,
      false,
    );
    return g ? [g] : [];
  });
}

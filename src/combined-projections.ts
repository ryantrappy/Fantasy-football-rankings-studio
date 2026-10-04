import type { LivePlayer } from './live-matchups';

// Stat meanings checked against ESPN's raw projection responses and espn-api's
// PLAYER_STATS_MAP. Only direct additive offensive stats are combined.
export const espnStatIds: Record<string, number> = {
  pass_att: 0,
  pass_cmp: 1,
  pass_inc: 2,
  pass_yd: 3,
  pass_td: 4,
  pass_2pt: 19,
  pass_int: 20,
  rush_att: 23,
  rush_yd: 24,
  rush_td: 25,
  rush_2pt: 26,
  rec_yd: 42,
  rec_td: 43,
  rec_2pt: 44,
  rec: 53,
  fum: 68,
  fum_lost: 72,
};
export interface ProjectionRules {
  weights: Record<string, number>;
  unsupported: string[];
}
export interface EspnScoringItem {
  statId: number;
  points: number;
  pointsOverrides?: Record<string, number>;
}
export function sleeperProjectionRules(scoring: Record<string, number>): ProjectionRules {
  const weights: Record<string, number> = {},
    unsupported: string[] = [];
  for (const [key, value] of Object.entries(scoring)) {
    if (!value) continue;
    if (key in espnStatIds && Number.isFinite(value)) weights[key] = value;
    // Kicker and team/individual-defense scoring does not apply to this offensive slice.
    else if (
      !/^(fg|xp|pts_allow|yds_allow|def|idp|sack|int$|ff$|fr$|safe$|blk_kick$|tkl|pass_def|st_)/.test(
        key,
      )
    )
      unsupported.push(key);
  }
  return { weights, unsupported };
}
export function espnProjectionRules(
  items: EspnScoringItem[] | undefined,
  position: string,
): ProjectionRules {
  if (!items?.length) return { weights: {}, unsupported: ['Scoring settings unavailable'] };
  const positionId = ({ QB: 1, RB: 2, WR: 3, TE: 4 } as Record<string, number>)[position];
  const weights: Record<string, number> = {},
    unsupported: string[] = [];
  for (const item of items) {
    const weight = item.pointsOverrides?.[String(positionId)] ?? item.points;
    if (!weight) continue;
    const key = Object.keys(espnStatIds).find((key) => espnStatIds[key] === item.statId);
    if (key && Number.isFinite(weight)) weights[key] = (weights[key] ?? 0) + weight;
    else if (item.statId < 74 || item.statId >= 200) unsupported.push(`ESPN stat ${item.statId}`);
  }
  return { weights, unsupported };
}
export function scoreProjection(
  stats: Record<string, number> | undefined,
  rules: ProjectionRules,
  position: string,
): number | undefined {
  if (
    !stats ||
    !Object.keys(stats).length ||
    rules.unsupported.length ||
    !Object.keys(rules.weights).length
  )
    return undefined;
  if (!['QB', 'RB', 'WR', 'TE'].includes(position)) return undefined;
  const primary = position === 'QB' ? 'pass_yd' : position === 'RB' ? 'rush_yd' : 'rec_yd';
  if (!Number.isFinite(stats[primary])) return undefined;
  if (rules.weights.rec && position !== 'QB' && !Number.isFinite(stats.rec)) return undefined;
  let points = 0;
  for (const [key, weight] of Object.entries(rules.weights)) {
    // Both feeds use sparse stat dictionaries: omitted non-primary events are zero.
    const value = stats[key] ?? 0;
    if (!Number.isFinite(value)) return undefined;
    points += value * weight;
  }
  return Number.isFinite(points) ? points : undefined;
}
export function combinePlayerProjection(
  player: LivePlayer,
  native: 'ESPN' | 'Sleeper',
  sources: NonNullable<LivePlayer['projectionSources']>,
  note?: string,
): LivePlayer {
  const usable = sources.filter((source) => Number.isFinite(source.points));
  const mean = usable.length === 2;
  const fallback = Number.isFinite(player.projectedPoints)
    ? player.projectedPoints
    : usable[0]?.points;
  return {
    ...player,
    projectedPoints: mean ? (usable[0].points + usable[1].points) / 2 : fallback,
    projectionSources: usable,
    projectionMethod: mean
      ? 'mean'
      : Number.isFinite(player.projectedPoints)
        ? 'native'
        : 'single-source',
    projectionSpread: mean ? Math.abs(usable[0].points - usable[1].points) : undefined,
    projectionNote: mean
      ? 'Equal-weight ESPN/Sleeper mean, scored with this league’s rules. Source spread is disagreement, not a confidence interval; accuracy improvement is unverified.'
      : (note ?? `${native} projection retained; comparable dual-source coverage is unavailable.`),
  };
}

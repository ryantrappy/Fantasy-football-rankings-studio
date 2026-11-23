import type { LivePlayer } from './live-matchups';

export function scoreSleeperProjection(
  stats: Record<string, number> | undefined,
  scoring: Record<string, number>,
) {
  const applicable = Object.entries(stats ?? {}).filter(([stat]) => Object.hasOwn(scoring, stat));
  if (
    !applicable.length ||
    applicable.some(([stat, value]) => !Number.isFinite(value) || !Number.isFinite(scoring[stat]))
  )
    return undefined;
  const points = applicable.reduce((sum, [stat, value]) => sum + value * scoring[stat], 0);
  return Number.isFinite(points) ? points : undefined;
}

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
const nativeOnlySleeperScoring: Record<string, string> = {
  bonus_rec_yd_100: '100–199 receiving-yard bonus',
  bonus_rec_yd_200: '200+ receiving-yard bonus',
  fum_rec: 'fumble recoveries',
  fum_rec_td: 'fumble-recovery touchdowns',
};

export interface ProjectionRules {
  weights: Record<string, number>;
  unsupported: string[];
  nativeOnly?: string[];
}
export interface EspnScoringItem {
  statId: number;
  points: number;
  pointsOverrides?: Record<string, number>;
}
export function sleeperProjectionRules(scoring: Record<string, number>): ProjectionRules {
  const weights: Record<string, number> = {},
    unsupported: string[] = [],
    nativeOnly: string[] = [];
  for (const [key, value] of Object.entries(scoring)) {
    if (!value) continue;
    if (Object.hasOwn(espnStatIds, key) && Number.isFinite(value)) weights[key] = value;
    else if (Object.hasOwn(nativeOnlySleeperScoring, key) && Number.isFinite(value))
      nativeOnly.push(nativeOnlySleeperScoring[key]);
    // Kicker and team/individual-defense scoring does not apply to this offensive slice.
    else if (
      !/^(fg|xp|pts_allow|yds_allow|def|idp|sack|int$|ff$|fr$|safe$|blk_kick$|tkl|pass_def|st_)/.test(
        key,
      )
    )
      unsupported.push(key);
  }
  return { weights, unsupported, ...(nativeOnly.length && { nativeOnly }) };
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
    const value = Object.hasOwn(stats, key) ? stats[key] : 0;
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
  nativeOnly: readonly string[] = [],
): LivePlayer {
  const usable = sources.filter((source) => Number.isFinite(source.points));
  const sharedOnly = nativeOnly.length > 0;
  const espn = usable.find((source) => source.provider === 'ESPN');
  const sleeper = usable.find((source) => source.provider === 'Sleeper');
  const nativePoints = Number.isFinite(player.projectedPoints) ? player.projectedPoints : undefined;
  const spread = espn && sleeper ? Math.abs(espn.points - sleeper.points) : undefined;
  if (sharedOnly) {
    const nativeShared = native === 'Sleeper' ? sleeper?.points : espn?.points;
    const otherShared = native === 'Sleeper' ? espn?.points : sleeper?.points;
    // Change the shared portion of the native total by half the provider difference.
    // This retains any native scoring outside the shared stat set exactly once.
    const adjusted =
      nativePoints !== undefined && nativeShared !== undefined && otherShared !== undefined
        ? nativePoints + (otherShared - nativeShared) / 2
        : undefined;
    const blended = adjusted !== undefined && Number.isFinite(adjusted);
    const scope = `Shared stat points use this league’s scoring. Native-only categories: ${nativeOnly.join(', ')}.`;
    return {
      ...player,
      projectedPoints: blended ? adjusted : nativePoints,
      projectionSources: usable.map((source) => ({ ...source, scope: 'shared-stats' })),
      projectionMethod: blended
        ? 'partial-mean'
        : nativePoints === undefined
          ? undefined
          : 'native',
      projectionSpread: spread,
      projectionNote: blended
        ? `Equal-weight blend of shared stats plus any points Sleeper already included for native-only scoring. ${scope}`
        : `A partial blend requires both shared projections and a native total. ${scope}`,
    };
  }
  const mean = espn && sleeper ? (espn.points + sleeper.points) / 2 : undefined;
  return {
    ...player,
    projectedPoints: mean ?? nativePoints ?? usable[0]?.points,
    projectionSources: usable,
    projectionMethod:
      mean !== undefined ? 'mean' : nativePoints !== undefined ? 'native' : 'single-source',
    projectionSpread: spread,
    projectionNote:
      mean !== undefined
        ? 'Equal-weight ESPN/Sleeper mean, scored with this league’s rules. Source spread is disagreement, not a confidence interval; accuracy improvement is unverified.'
        : (note ??
          `${native} projection retained; comparable dual-source coverage is unavailable.`),
  };
}

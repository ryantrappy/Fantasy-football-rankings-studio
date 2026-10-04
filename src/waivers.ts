import type { LivePlayer, LiveTeam } from './live-matchups';
import { unavailableStatus } from './server/insights/projections';
import { adviseLineup } from './lineup-advisor';
export interface WaiverPool {
  capturedAt: string;
  week: number | null;
  candidates: LivePlayer[];
  team?: LiveTeam;
  slots?: string[];
  ownership?: { covered: number; expected: number };
  notices: string[];
  unavailable?: string;
}
export function verifiedUnowned(
  rosters: { roster_id: number; players?: string[]; reserve?: string[]; taxi?: string[] }[],
  expected: number,
  candidates: string[],
) {
  if (
    !Number.isInteger(expected) ||
    expected < 1 ||
    rosters.length !== expected ||
    new Set(rosters.map((roster) => roster.roster_id)).size !== expected ||
    rosters.some((roster) => !Array.isArray(roster.players))
  )
    return undefined;
  const owned = new Set(
    rosters.flatMap((roster) => [
      ...roster.players!,
      ...(roster.reserve ?? []),
      ...(roster.taxi ?? []),
    ]),
  );
  return [...new Set(candidates)].filter((id) => !owned.has(id));
}
export function waiverImpact(pool: WaiverPool, candidate: LivePlayer, dropId: string) {
  const drop = pool.team?.players.find((player) => player.id === dropId);
  if (
    !pool.team ||
    !drop ||
    drop.reserve ||
    drop.locked ||
    drop.position !== candidate.position ||
    candidate.locked ||
    candidate.bye ||
    unavailableStatus(candidate.availability) ||
    !pool.candidates.some((player) => player.id === candidate.id) ||
    pool.team.players.some((player) => player.id === candidate.id)
  )
    return {
      difference: null,
      reason:
        'Choose an unowned candidate and an unlocked active roster drop of the same position.',
    };
  const before = adviseLineup(pool.team.players, pool.slots);
  const after = adviseLineup(
    [
      ...pool.team.players.filter((player) => player.id !== dropId),
      { ...candidate, starter: false },
    ],
    pool.slots,
  );
  if (
    before.proposed === null ||
    after.proposed === null ||
    before.difference === null ||
    after.notices.some((notice) => notice.startsWith('Missing projections'))
  )
    return {
      difference: null,
      reason: 'Complete lineup/projection coverage is unavailable for this scenario.',
    };
  return { difference: after.proposed - before.proposed, reason: undefined };
}

export function recommendedDrop(pool: WaiverPool, candidate: LivePlayer) {
  return (pool.team?.players ?? [])
    .map((player) => ({ player, impact: waiverImpact(pool, candidate, player.id) }))
    .filter((entry) => entry.impact.difference !== null && entry.impact.difference > 0)
    .sort(
      (a, b) =>
        b.impact.difference! - a.impact.difference! || a.player.name.localeCompare(b.player.name),
    )[0];
}

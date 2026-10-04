import type { LivePlayer } from './live-matchups';
import {
  bestProjectedLineup,
  sleeperSlot,
  unavailableStatus,
  type Slot,
} from './server/insights/projections';
const aliases: Record<string, string> = {
  'SUPER FLEX': 'SUPER_FLEX',
  'RB/WR FLEX': 'WRRB_FLEX',
  'WR/TE FLEX': 'REC_FLEX',
  'IDP FLEX': 'IDP_FLEX',
  DST: 'DEF',
};
export function adviseLineup(
  players: LivePlayer[],
  slotLabels: string[] | undefined,
  excluded: string[] = [],
) {
  const notices: string[] = [];
  if (players.some((player) => player.locked === undefined))
    notices.push(
      'Some game/lineup locks are unknown. Confirm eligibility at your provider before making changes.',
    );
  if (players.some((player) => player.availability === undefined || player.bye === undefined))
    notices.push('Some injury or bye information is unavailable.');
  const uncertain = players.filter((player) =>
    ['QUESTIONABLE', 'DOUBTFUL'].includes((player.availability ?? '').toUpperCase()),
  );
  if (uncertain.length)
    notices.push(`Uncertain availability: ${uncertain.map((player) => player.name).join(', ')}.`);
  if (!slotLabels?.length || slotLabels.some((label) => label.startsWith('Unsupported')))
    return {
      notices,
      reason: 'Configured lineup slots are unavailable or unsupported.',
      submitted: null,
      proposed: null,
      difference: null,
      starts: [],
      benches: [],
      assignment: [],
    };
  const unfilled = [...slotLabels];
  const fixed: { label: string; player: LivePlayer }[] = [];
  for (const player of players.filter((entry) => entry.starter && entry.locked)) {
    const index = unfilled.findIndex(
      (label) =>
        (aliases[label] ?? label) === (aliases[player.lineupSlot ?? ''] ?? player.lineupSlot),
    );
    if (index < 0)
      return {
        notices,
        reason: 'A locked starter cannot be matched to a configured slot.',
        submitted: null,
        proposed: null,
        difference: null,
        starts: [],
        benches: [],
        assignment: [],
      };
    fixed.push({ label: unfilled.splice(index, 1)[0], player });
  }
  const eligible = (player: LivePlayer) =>
    !player.reserve &&
    !excluded.includes(player.id) &&
    !unavailableStatus(player.availability) &&
    !player.bye;
  const point = (player: LivePlayer) => (player.bye ? 0 : player.projectedPoints);
  const current = players.filter((player) => player.starter);
  const submitted =
    current.length === slotLabels.length &&
    current.every((player) => Number.isFinite(point(player)))
      ? current.reduce((sum, player) => sum + point(player)!, 0)
      : null;
  const candidates = players.filter(
    (player) =>
      fixed.some((entry) => entry.player.id === player.id) || (eligible(player) && !player.locked),
  );
  const labels = [...fixed.map((entry) => entry.label), ...unfilled];
  const slots: Slot[] = labels.map((label, index) => ({
    accepts: (position, id) => {
      const player = candidates.find((entry) => entry.id === id);
      if (index < fixed.length) return id === fixed[index].player.id;
      if (fixed.some((entry) => entry.player.id === id)) return false;
      return player?.eligibleSlots?.length
        ? player.eligibleSlots.includes(label)
        : Boolean(sleeperSlot(aliases[label] ?? label)?.accepts(position));
    },
  }));
  const proposed = bestProjectedLineup(
    candidates.map((player) => ({
      id: player.id,
      position: player.position ?? '',
      points: point(player) ?? Number.NaN,
      starter: player.starter,
    })),
    slots,
  );
  const missing = players.filter((player) => eligible(player) && !Number.isFinite(point(player)));
  if (missing.length)
    notices.push(
      `Missing projections: ${missing.map((player) => player.name).join(', ')}. No complete comparison is claimed.`,
    );
  if (!proposed)
    return {
      notices,
      reason: 'A complete legal projected lineup is unavailable.',
      submitted,
      proposed: null,
      difference: null,
      starts: [],
      benches: [],
      assignment: [],
    };
  const selected = new Set(proposed.playerIds);
  return {
    notices,
    reason: undefined,
    submitted,
    proposed: proposed.points,
    difference: submitted !== null && !missing.length ? proposed.points - submitted : null,
    starts: players.filter((player) => selected.has(player.id) && !player.starter),
    benches: current.filter((player) => !selected.has(player.id)),
    assignment: proposed.assignedPlayerIds.map((id, index) => ({
      slot: labels[index],
      player: players.find((player) => player.id === id)!,
    })),
  };
}

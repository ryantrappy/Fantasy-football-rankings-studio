import type { LiveTeam } from './live-matchups';
import { adviseLineup } from './lineup-advisor';
export interface TradeProposal {
  send: string[][];
  drops: string[][];
  openSlots: number[];
  acknowledgeImbalance: boolean;
}
export function evaluateTrade(
  teams: [LiveTeam, LiveTeam],
  slots: string[] | undefined,
  proposal: TradeProposal,
) {
  const all = [...proposal.send.flat(), ...proposal.drops.flat()];
  if (
    teams[0].teamId === teams[1].teamId ||
    new Set(all).size !== all.length ||
    !proposal.send[0]?.length ||
    !proposal.send[1]?.length
  )
    return {
      error: 'Choose two distinct teams and unique owned players on both sides.',
      sides: [],
    };
  const imbalance = proposal.send[0].length !== proposal.send[1].length;
  if (imbalance && !proposal.acknowledgeImbalance)
    return {
      error: 'Confirm explicit open-slot assumptions for this unbalanced exchange.',
      sides: [],
    };
  for (let index = 0; index < 2; index++) {
    if (
      !Number.isInteger(proposal.openSlots[index]) ||
      proposal.openSlots[index] < 0 ||
      proposal.openSlots[index] > 10
    )
      return { error: 'Enter a valid explicit open-slot assumption (0–10).', sides: [] };
    for (const id of [...proposal.send[index], ...proposal.drops[index]]) {
      const player = teams[index].players.find((entry) => entry.id === id && entry.owned === true);
      if (!player || player.reserve || player.locked)
        return {
          error:
            'Assets must belong to the selected team’s active roster and have no known game lock. Reserve/taxi assets and draft picks are unsupported.',
          sides: [],
        };
    }
    const increase =
      proposal.send[1 - index].length - proposal.send[index].length - proposal.drops[index].length;
    if (increase > proposal.openSlots[index])
      return {
        error: `Team ${teams[index].name} needs ${increase} open roster ${increase === 1 ? 'slot' : 'slots'} for this exchange.`,
        sides: [],
      };
  }
  const sides = teams.map((team, index) => {
    const remove = new Set([...proposal.send[index], ...proposal.drops[index]]);
    const players = [
      ...team.players.filter((player) => player.owned && !remove.has(player.id)),
      ...teams[1 - index].players
        .filter((player) => proposal.send[1 - index].includes(player.id))
        .map((player) => ({ ...player, starter: false, lineupSlot: undefined })),
    ];
    const before = adviseLineup(
      team.players.filter((player) => player.owned),
      slots,
    );
    const after = adviseLineup(players, slots);
    const complete =
      before.proposed !== null &&
      after.proposed !== null &&
      ![...before.notices, ...after.notices].some((notice) =>
        notice.startsWith('Missing projections'),
      );
    return {
      teamId: team.teamId,
      name: team.name,
      before: before.proposed,
      after: after.proposed,
      difference: complete ? after.proposed! - before.proposed! : null,
      coverage: [
        ...new Set(
          players.filter((player) => !player.reserve).map((player) => player.position ?? 'Unknown'),
        ),
      ].map((position) => ({
        position,
        count: players.filter((player) => player.position === position && !player.reserve).length,
      })),
      notices: [
        ...new Set([...before.notices, ...after.notices, ...(after.reason ? [after.reason] : [])]),
      ],
      rosterSize: players.filter((player) => !player.reserve).length,
    };
  });
  return { error: undefined, sides };
}

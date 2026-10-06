import { adviseLineup } from './lineup-advisor';
import type { LiveLeague, LivePlayer, LiveTeam } from './live-matchups';
import type { ManagedTeamSelection } from './types';
import { evaluateTrade } from './trade-analysis';

export function tradeTeams(league: LiveLeague): LiveTeam[] {
  return [
    ...new Map(
      league.matchups
        .flatMap((matchup) => [matchup.home, ...(matchup.away ? [matchup.away] : [])])
        .map((team) => [team.teamId, team]),
    ).values(),
  ];
}

export interface TradeSuggestion {
  id: string;
  counterpart: LiveTeam;
  send: LivePlayer;
  receive: LivePlayer;
  sides: ReturnType<typeof evaluateTrade>['sides'][number][];
}

const supportedPositions = new Set([
  'QB',
  'RB',
  'WR',
  'TE',
  'K',
  'DEF',
  'DST',
  'DL',
  'DE',
  'DT',
  'LB',
  'DB',
  'CB',
  'S',
]);
const supportedIdentity = (player: LivePlayer, provider: LiveLeague['provider']) =>
  supportedPositions.has(player.position ?? '') &&
  (/^[1-9]\d*$/.test(player.id) ||
    (provider === 'Sleeper' &&
      ['DEF', 'DST'].includes(player.position ?? '') &&
      /^[A-Z]{2,3}$/.test(player.id)));

export function suggestTrades(league: LiveLeague, selection: ManagedTeamSelection) {
  const suggestions: TradeSuggestion[] = [];
  const notices = [
    'Only current-week, player-only one-for-one exchanges are evaluated. Draft picks, reserve/taxi assets and future-week trade value are unsupported.',
    'Unreported trade deadlines, approval rules, positional roster limits and provider transaction eligibility are unknown. Confirm these at your provider before proposing an offer.',
    'Candidates exclude game-locked players, byes, flagged or unknown injury status, unknown game/bye status, unsupported identities and missing projections. Other lineup game locks are ignored for the hypothetical comparison.',
  ];
  const teams = tradeTeams(league);
  const managed = teams.find((team) => team.teamId === selection.teamId);
  let evaluated = 0;
  let incomplete = 0;
  const result = (reason?: string) => ({ suggestions, notices, evaluated, incomplete, reason });
  if (league.error) return result(league.error);
  if (league.tradeRules?.disabled) return result('Trading is disabled by the league’s settings.');
  if (league.tradeRules?.deadlinePassed)
    return result('The league’s trade deadline has passed. No suggestions are available.');
  if (league.tradeRules?.deadlineWeek !== undefined)
    notices.push(
      `Reported trade deadline: Week ${league.tradeRules.deadlineWeek}. Confirm the deadline and processing time before acting.`,
    );
  if (league.tradeRules?.reviewDays !== undefined)
    notices.push(
      `Reported trade review period: ${league.tradeRules.reviewDays} days. This comparison assumes immediate hypothetical lineup availability; provider processing may delay the benefit.`,
    );
  if (
    selection.needsReselection ||
    !managed ||
    !selection.teams.some((team) => team.teamId === managed.teamId)
  )
    return result(
      'Choose and save your managed team for this league and season to find suggestions.',
    );
  if (
    !league.lineupSlots?.length ||
    league.lineupSlots.some((slot) => slot.startsWith('Unsupported'))
  )
    return result(
      'Configured lineup rules are unavailable or unsupported. Suggestions cannot be evaluated.',
    );

  const ownedIds = teams.flatMap((team) =>
    team.players.filter((player) => player.owned).map((player) => player.id),
  );
  if (new Set(ownedIds).size !== ownedIds.length)
    return result('Roster ownership is ambiguous. Refresh rosters before finding suggestions.');
  const normalized = new Map(
    teams.map((team) => [
      team.teamId,
      team.players
        .filter((player) => player.owned === true)
        .map((player) => ({ ...player, locked: false })),
    ]),
  );
  const baselines = new Map(
    teams.map((team) => [
      team.teamId,
      adviseLineup(normalized.get(team.teamId)!, league.lineupSlots),
    ]),
  );
  const complete = (team: LiveTeam) => {
    const baseline = baselines.get(team.teamId)!;
    return (
      baseline.proposed !== null &&
      !baseline.notices.some((notice) => notice.startsWith('Missing projections')) &&
      normalized
        .get(team.teamId)!
        .filter((player) => !player.reserve)
        .every((player) => supportedIdentity(player, league.provider))
    );
  };
  if (!complete(managed))
    return result(
      'Complete managed-team lineup, identity or projection coverage is unavailable. Refresh rosters and try again.',
    );
  const eligible = (team: LiveTeam) =>
    team.players.filter(
      (player) =>
        player.owned === true &&
        !player.reserve &&
        supportedIdentity(player, league.provider) &&
        player.locked === false &&
        player.bye === false &&
        player.availability !== undefined &&
        ['', 'ACTIVE', 'HEALTHY'].includes((player.availability ?? '').toUpperCase()) &&
        Number.isFinite(player.projectedPoints),
    );
  const outgoing = eligible(managed);
  const improvements = new Map<string, boolean>();
  // An incoming player must improve even the roster that keeps its outgoing asset.
  // This exact upper bound avoids evaluating every pair of irrelevant bench players.
  const canImprove = (team: LiveTeam, player: LivePlayer) => {
    const key = JSON.stringify([team.teamId, player.id]);
    if (!improvements.has(key)) {
      const added = adviseLineup(
        [
          ...normalized.get(team.teamId)!,
          { ...player, starter: false, locked: false, lineupSlot: undefined },
        ],
        league.lineupSlots,
      );
      improvements.set(
        key,
        added.proposed !== null && added.proposed > baselines.get(team.teamId)!.proposed!,
      );
    }
    return improvements.get(key)!;
  };
  for (const counterpart of teams) {
    if (counterpart.teamId === managed.teamId) continue;
    if (!complete(counterpart)) {
      incomplete++;
      continue;
    }
    for (const receive of eligible(counterpart).filter((player) => canImprove(managed, player))) {
      for (const send of outgoing.filter((player) => canImprove(counterpart, player))) {
        evaluated++;
        const impact = evaluateTrade([managed, counterpart], league.lineupSlots, {
          send: [[send.id], [receive.id]],
          drops: [[], []],
          openSlots: [0, 0],
          acknowledgeImbalance: false,
        });
        const sides: TradeSuggestion['sides'] = impact.sides;
        if (
          impact.error ||
          sides.length !== 2 ||
          sides.some((side) => side.difference === null || Number(side.difference.toFixed(2)) <= 0)
        )
          continue;
        suggestions.push({
          id: JSON.stringify([managed.teamId, counterpart.teamId, send.id, receive.id]),
          counterpart,
          send,
          receive,
          sides,
        });
      }
    }
  }
  // Reward the weaker of the two gains first, then the combined usable-lineup gain.
  // This ranks counterpart benefit without claiming market fairness or acceptance.
  const gains = (suggestion: TradeSuggestion) => suggestion.sides.map((side) => side.difference!);
  suggestions.sort(
    (a, b) =>
      Math.min(...gains(b)) - Math.min(...gains(a)) ||
      gains(b).reduce((sum, value) => sum + value, 0) -
        gains(a).reduce((sum, value) => sum + value, 0) ||
      a.id.localeCompare(b.id),
  );
  suggestions.splice(5);
  if (incomplete)
    notices.push(
      `${incomplete} counterpart ${incomplete === 1 ? 'team was' : 'teams were'} skipped because complete lineup, identity or projection coverage is unavailable.`,
    );
  return result();
}

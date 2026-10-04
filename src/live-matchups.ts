export interface LivePlayer {
  id: string;
  name: string;
  availability?: string | null;
  bye?: boolean;
  locked?: boolean;
  reserve?: boolean;
  eligibleSlots?: string[];
  position?: string;
  lineupSlot?: string;
  points: number | null;
  starter: boolean;
  projectedPoints?: number;
  remainingFraction?: number;
}

export interface LiveTeam {
  teamId: string;
  name: string;
  score: number | null;
  players: LivePlayer[];
}

export interface LiveMatchup {
  id: string;
  home: LiveTeam;
  away: LiveTeam | null;
}

export interface LiveLeague {
  leagueId: string;
  leagueName: string;
  provider: 'Sleeper' | 'ESPN';
  season: number;
  week: number;
  lineupSlots?: string[];
  capturedAt?: string;
  matchups: LiveMatchup[];
  error?: string;
}

const positions = [
  'QB',
  'SUPER FLEX',
  'RB',
  'WR',
  'TE',
  'FLEX',
  'RB/WR FLEX',
  'WR/TE FLEX',
  'K',
  'DST',
  'DL',
  'DE',
  'DT',
  'LB',
  'DB',
  'CB',
  'S',
  'IDP FLEX',
];
const position = (player: LivePlayer) => {
  const label = (player.starter && player.lineupSlot) || player.position || 'Unknown';
  return label === 'DEF' ? 'DST' : label;
};

export function sleeperLineupSlots(starters: string[], rosterPositions: string[]) {
  const slots = rosterPositions.filter((slot) => !['BN', 'BENCH', 'IR', 'TAXI'].includes(slot));
  const labels: Record<string, string> = {
    SUPER_FLEX: 'SUPER FLEX',
    WRRB_FLEX: 'RB/WR FLEX',
    REC_FLEX: 'WR/TE FLEX',
    IDP_FLEX: 'IDP FLEX',
    DEF: 'DST',
  };
  // Sleeper's starters are ordered by roster_positions, including empty '0' entries.
  return new Map(
    starters.flatMap((id, index) =>
      id !== '0' && slots[index] ? [[id, labels[slots[index]] || slots[index]]] : [],
    ),
  );
}

export function espnLineupSlot(id: number): string | undefined {
  return (
    {
      0: 'QB',
      2: 'RB',
      3: 'RB/WR FLEX',
      4: 'WR',
      5: 'WR/TE FLEX',
      6: 'TE',
      7: 'SUPER FLEX',
      16: 'DST',
      17: 'K',
      23: 'FLEX',
    } as Record<number, string>
  )[id];
}

// Pad each position independently so unequal roster sizes cannot shift opposing rows.
export function alignedPlayers(home: LivePlayer[], away: LivePlayer[], starter: boolean) {
  const left = home.filter((player) => player.starter === starter);
  const right = away.filter((player) => player.starter === starter);
  const groups = [...new Set([...left, ...right].map(position))].sort((a, b) => {
    const rank = (value: string) =>
      positions.includes(value) ? positions.indexOf(value) : positions.length;
    return rank(a) - rank(b) || a.localeCompare(b);
  });
  return groups.flatMap((group) => {
    const ordered = (players: LivePlayer[]) =>
      players
        .filter((player) => position(player) === group)
        .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    const h = ordered(left),
      a = ordered(right);
    return Array.from({ length: Math.max(h.length, a.length) }, (_, index) => ({
      position: group,
      home: h[index],
      away: a[index],
    }));
  });
}

export function winProbability(matchup: LiveMatchup): number | null {
  const estimate = (team: LiveTeam) => {
    if (team.score == null || !Number.isFinite(team.score)) return null;
    const starters = team.players.filter((player) => player.starter);
    if (!starters.length) return null;
    let mean = team.score,
      variance = 0;
    for (const player of starters) {
      const remaining = player.remainingFraction;
      if (remaining == null || !Number.isFinite(remaining) || remaining < 0 || remaining > 1)
        return null;
      if (remaining === 0) continue;
      if (player.projectedPoints == null || !Number.isFinite(player.projectedPoints)) return null;
      // Independent player scoring with a deliberately broad, uncalibrated 65% spread.
      const projected = Math.max(0, player.projectedPoints);
      mean += projected * remaining;
      variance += Math.max(3, projected * 0.65) ** 2 * remaining;
    }
    return { mean, variance };
  };
  if (!matchup.away) return null;
  const home = estimate(matchup.home),
    away = estimate(matchup.away);
  if (!home || !away) return null;
  const variance = home.variance + away.variance;
  if (!variance) return home.mean === away.mean ? 50 : home.mean > away.mean ? 100 : 0;
  // Logistic approximation of the normal CDF; percentages are complementary.
  const z = (home.mean - away.mean) / Math.sqrt(variance);
  return Math.max(1, Math.min(99, Math.round(100 / (1 + Math.exp(-1.702 * z)))));
}

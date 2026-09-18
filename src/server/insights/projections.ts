import type { PlayoffProjection, RosterSnapshot, ScoreWeek } from '../../insights';

type ProjectedPlayer = {
  id: string;
  position: string;
  points: number;
  starter: boolean;
};

type Slot = { accepts: (position: string) => boolean };

export const unavailableStatus = (status?: string | null) =>
  [
    'OUT',
    'IR',
    'INJURED_RESERVE',
    'INJURY_RESERVE',
    'SUSPENDED',
    'SUSPENSION',
    'PUP',
    'COVID',
  ].includes((status || '').toUpperCase().replaceAll(' ', '_'));
const uncertainStatus = (status?: string | null) =>
  ['QUESTIONABLE', 'DOUBTFUL'].includes((status || '').toUpperCase());

function bestProjectedLineup(players: ProjectedPlayer[], slots: Slot[]) {
  if (!slots.length) return undefined;
  const candidates = [
    ...new Map(
      players
        .filter((player) => Number.isFinite(player.points))
        .map((player) => [player.id, player]),
    ).values(),
  ];
  let states = new Map<string, { chosen: number[]; points: number; benchSelections: number }>([
    ['', { chosen: [], points: 0, benchSelections: 0 }],
  ]);
  for (const slot of slots) {
    const next = new Map<string, { chosen: number[]; points: number; benchSelections: number }>();
    for (const state of states.values())
      for (let index = 0; index < candidates.length; index++) {
        const player = candidates[index];
        if (state.chosen.includes(index) || !slot.accepts(player.position)) continue;
        const chosen = [...state.chosen, index].sort((a, b) => a - b);
        const candidate = {
          chosen,
          points: state.points + player.points,
          benchSelections: state.benchSelections + Number(!player.starter),
        };
        const key = chosen.join(',');
        if (!next.has(key) || next.get(key)!.points < candidate.points) next.set(key, candidate);
      }
    states = next;
    if (!states.size) return undefined;
  }
  const best = [...states.values()].reduce((best, candidate) =>
    candidate.points > best.points ? candidate : best,
  );
  return { ...best, playerIds: best.chosen.map((index) => candidates[index].id) };
}

const sleeperSlot = (slot: string): Slot | undefined => {
  const normalized = slot.toUpperCase();
  if (['BN', 'BENCH', 'IR', 'TAXI'].includes(normalized)) return undefined;
  const accepted: Record<string, string[]> = {
    QB: ['QB'],
    RB: ['RB'],
    WR: ['WR'],
    TE: ['TE'],
    K: ['K'],
    DEF: ['DEF', 'DST'],
    FLEX: ['RB', 'WR', 'TE'],
    WRRB_FLEX: ['WR', 'RB'],
    REC_FLEX: ['WR', 'TE'],
    SUPER_FLEX: ['QB', 'RB', 'WR', 'TE'],
    IDP_FLEX: ['DL', 'DE', 'DT', 'LB', 'DB', 'CB', 'S'],
    DL: ['DL', 'DE', 'DT'],
    DB: ['DB', 'CB', 'S'],
  };
  const positions = accepted[normalized] || [normalized];
  return { accepts: (position) => positions.includes(position.toUpperCase()) };
};

const espnPosition = (id: number | undefined) =>
  ({ 1: 'QB', 2: 'RB', 3: 'WR', 4: 'TE', 5: 'K', 16: 'DST' })[id ?? -1];

function espnSlot(slotId: number, currentPosition?: string): Slot | undefined {
  const accepted: Record<number, string[]> = {
    0: ['QB'],
    2: ['RB'],
    3: ['RB', 'WR'],
    4: ['WR'],
    5: ['WR', 'TE'],
    6: ['TE'],
    7: ['QB', 'RB', 'WR', 'TE'],
    16: ['DST'],
    17: ['K'],
    23: ['RB', 'WR', 'TE'],
  };
  const positions = accepted[slotId] || (currentPosition ? [currentPosition] : undefined);
  return positions
    ? { accepts: (position) => positions.includes(position.toUpperCase()) }
    : undefined;
}

interface SleeperProjectionRow {
  player_id?: string;
  stats?: Record<string, number>;
}

export function sleeperProjectionSnapshot(
  week: number,
  teamIds: string[],
  rosters: RosterSnapshot['teams'],
  projections: SleeperProjectionRow[],
  scoring: Record<string, number>,
  rosterPositions: string[],
  playerPositions: Record<string, string>,
  availability: Record<string, string | null> = {},
): PlayoffProjection {
  const pointsByPlayer = new Map(
    projections
      .filter((row): row is SleeperProjectionRow & { player_id: string } => !!row.player_id)
      .map((row) => [
        row.player_id,
        Object.keys(row.stats || {}).length
          ? Object.entries(row.stats!).reduce((total, [stat, value]) => {
              const weight = scoring[stat];
              return (
                total + (Number.isFinite(value) && Number.isFinite(weight) ? value * weight : 0)
              );
            }, 0)
          : Number.NaN,
      ]),
  );
  const slots = rosterPositions.map(sleeperSlot).filter((slot): slot is Slot => !!slot);
  const teamPoints: Record<string, number> = {};
  let coveredStarters = 0;
  let totalStarters = 0;
  let benchSelections = 0;
  let unavailablePlayers = 0;
  let uncertainPlayers = 0;
  for (const teamId of teamIds) {
    totalStarters += slots.length;
    const roster = rosters.find((row) => row.teamId === teamId);
    const starters = new Set(roster?.starters || []);
    const players = [...new Set([...(roster?.starters || []), ...(roster?.bench || [])])]
      .filter((id) => {
        if (unavailableStatus(availability[id])) {
          unavailablePlayers++;
          return false;
        }
        if (uncertainStatus(availability[id])) uncertainPlayers++;
        return true;
      })
      .map((id) => ({
        id,
        position: playerPositions[id] || '',
        points: pointsByPlayer.get(id) ?? Number.NaN,
        starter: starters.has(id),
      }))
      .filter((player) => !!player.position);
    const lineup = bestProjectedLineup(players, slots);
    if (!lineup) continue;
    teamPoints[teamId] = lineup.points;
    coveredStarters += slots.length;
    benchSelections += lineup.benchSelections;
  }
  return {
    provider: 'Sleeper',
    capturedAt: new Date().toISOString(),
    unavailablePlayers,
    uncertainPlayers,
    availabilityChecked: Object.keys(availability).length > 0,
    week,
    teamPoints,
    coveredStarters,
    totalStarters,
    benchSelections,
    optimizedLineup: true,
  };
}

export function sleeperBestLineup(
  starters: string[],
  players: NonNullable<ScoreWeek['players']>,
  rosterPositions: string[],
  playerPositions: Record<string, string>,
): ScoreWeek['bestLineup'] {
  const slots = rosterPositions.map(sleeperSlot).filter((slot): slot is Slot => !!slot);
  const current = new Set(starters);
  const lineup = bestProjectedLineup(
    players
      .map((player) => ({
        id: player.playerId,
        position: playerPositions[player.playerId] || '',
        points: player.points,
        starter: current.has(player.playerId),
      }))
      .filter((player) => !!player.position),
    slots,
  );
  return lineup
    ? {
        points: lineup.points,
        correctStarts: lineup.playerIds.filter((id) => current.has(id)).length,
        slots: slots.length,
      }
    : undefined;
}

interface EspnProjectionEntry {
  lineupSlotId: number;
  playerId?: number;
  playerPoolEntry?: {
    player?: {
      id?: number;
      defaultPositionId?: number;
      injuryStatus?: string;
      stats?: {
        scoringPeriodId: number;
        seasonId: number;
        statSourceId: number;
        statSplitTypeId: number;
        appliedTotal: number;
      }[];
    };
  };
}

interface EspnProjectionSide {
  teamId: number;
  rosterForCurrentScoringPeriod?: { entries: EspnProjectionEntry[] };
}

export function espnProjectionSnapshot(
  year: number,
  week: number,
  teamIds: string[],
  sides: EspnProjectionSide[],
  slotCounts?: Record<string, number>,
): PlayoffProjection {
  const teamPoints: Record<string, number> = {};
  let coveredStarters = 0;
  let totalStarters = 0;
  let benchSelections = 0;
  let unavailablePlayers = 0;
  let uncertainPlayers = 0;
  let availabilityChecked = false;
  for (const teamId of teamIds) {
    const entries =
      sides.find((side) => String(side.teamId) === teamId)?.rosterForCurrentScoringPeriod
        ?.entries || [];
    const starters = entries.filter((entry) => ![20, 21].includes(entry.lineupSlotId));
    const configured =
      slotCounts &&
      Object.entries(slotCounts).flatMap(([id, count]) =>
        [20, 21].includes(Number(id))
          ? []
          : Array.from({ length: count }, () => espnSlot(Number(id))),
      );
    const slots =
      configured ||
      starters
        .map((entry) =>
          espnSlot(
            entry.lineupSlotId,
            espnPosition(entry.playerPoolEntry?.player?.defaultPositionId),
          ),
        )
        .filter((slot): slot is Slot => !!slot);
    totalStarters += slots.length;
    if (!slots.length || slots.some((s) => !s)) continue;
    const players = entries
      .filter((entry) => entry.lineupSlotId !== 21)
      .filter((entry) => {
        const status = entry.playerPoolEntry?.player?.injuryStatus;
        if (status != null) availabilityChecked = true;
        if (unavailableStatus(status)) {
          unavailablePlayers++;
          return false;
        }
        if (uncertainStatus(status)) uncertainPlayers++;
        return true;
      })
      .map((entry) => {
        const player = entry.playerPoolEntry?.player;
        const id = entry.playerId ?? player?.id;
        return {
          id: String(id),
          position: espnPosition(player?.defaultPositionId) || '',
          points:
            player?.stats?.find(
              (stat) =>
                stat.seasonId === year &&
                stat.scoringPeriodId === week &&
                stat.statSourceId === 1 &&
                stat.statSplitTypeId === 1 &&
                Number.isFinite(stat.appliedTotal),
            )?.appliedTotal ?? Number.NaN,
          starter: entry.lineupSlotId !== 20,
        };
      })
      .filter((player) => player.id !== 'undefined' && !!player.position);
    const lineup = bestProjectedLineup(players, slots as Slot[]);
    if (!lineup) continue;
    teamPoints[teamId] = lineup.points;
    coveredStarters += slots.length;
    benchSelections += lineup.benchSelections;
  }
  return {
    provider: 'ESPN',
    capturedAt: new Date().toISOString(),
    unavailablePlayers,
    uncertainPlayers,
    availabilityChecked,
    week,
    teamPoints,
    coveredStarters,
    totalStarters,
    benchSelections,
    optimizedLineup: true,
  };
}

export function espnBestLineup(
  year: number,
  week: number,
  entries: EspnProjectionEntry[],
): ScoreWeek['bestLineup'] {
  const starters = entries.filter((entry) => ![20, 21].includes(entry.lineupSlotId));
  const slots = starters
    .map((entry) =>
      espnSlot(entry.lineupSlotId, espnPosition(entry.playerPoolEntry?.player?.defaultPositionId)),
    )
    .filter((slot): slot is Slot => !!slot);
  if (slots.length !== starters.length) return undefined;
  const starterIds = new Set(
    starters.map((entry) => String(entry.playerId ?? entry.playerPoolEntry?.player?.id)),
  );
  const lineup = bestProjectedLineup(
    entries
      .filter((entry) => entry.lineupSlotId !== 21)
      .map((entry) => {
        const player = entry.playerPoolEntry?.player;
        const id = entry.playerId ?? player?.id;
        return {
          id: String(id),
          position: espnPosition(player?.defaultPositionId) || '',
          points:
            player?.stats?.find(
              (stat) =>
                stat.seasonId === year &&
                stat.scoringPeriodId === week &&
                stat.statSourceId === 0 &&
                stat.statSplitTypeId === 1 &&
                Number.isFinite(stat.appliedTotal),
            )?.appliedTotal ?? Number.NaN,
          starter: starterIds.has(String(id)),
        };
      })
      .filter((player) => player.id !== 'undefined' && !!player.position),
    slots,
  );
  return lineup
    ? {
        points: lineup.points,
        correctStarts: lineup.playerIds.filter((id) => starterIds.has(id)).length,
        slots: slots.length,
      }
    : undefined;
}

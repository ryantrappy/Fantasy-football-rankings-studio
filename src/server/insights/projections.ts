import type { PlayoffProjection, RosterSnapshot, ScoreWeek } from '../../insights';
import type { PlayoffSettings } from '../../playoff-forecast';

export function remainingProjectionWeeks(settings: PlayoffSettings, completedWeek: number) {
  const postseason =
    settings.rules?.roundWeeks.flat() ??
    Array.from(
      { length: Math.ceil(Math.log2(settings.playoffTeams)) },
      (_, i) => settings.regularSeasonEnd + i + 1,
    );
  return [
    ...new Set([
      completedWeek + 1,
      ...Array.from(
        { length: Math.max(0, settings.regularSeasonEnd - completedWeek) },
        (_, i) => completedWeek + i + 1,
      ),
      ...postseason,
    ]),
  ]
    .filter((week) => week > completedWeek && week <= 18)
    .sort((a, b) => a - b);
}

export function sleeperByeWeeks(
  games: { week: number; home: string; away: string }[],
  playerTeams: Record<string, string>,
) {
  const nflTeams = new Set(games.flatMap((game) => [game.home, game.away]));
  // Only infer absence from a complete season schedule, never an empty response.
  if (nflTeams.size !== 32 || games.length < 250) return {};
  const byeByTeam = new Map<string, number>();
  for (const team of nflTeams) {
    const playing = new Set(
      games.filter((game) => game.home === team || game.away === team).map((game) => game.week),
    );
    const missing = Array.from({ length: 18 }, (_, i) => i + 1).filter(
      (week) => !playing.has(week),
    );
    if (missing.length === 1) byeByTeam.set(team, missing[0]);
  }
  return Object.fromEntries(
    Object.entries(playerTeams)
      .filter(([, team]) => byeByTeam.has(team))
      .map(([id, team]) => [id, byeByTeam.get(team)!]),
  );
}

export type ProjectedPlayer = {
  id: string;
  position: string;
  points: number;
  starter: boolean;
};

export type Slot = { accepts: (position: string, id?: string) => boolean };

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

export function bestProjectedLineup(players: ProjectedPlayer[], slots: Slot[]) {
  if (!slots.length) return undefined;
  const candidates = [
    ...new Map(
      players
        .filter((player) => Number.isFinite(player.points))
        .map((player) => [player.id, player]),
    ).values(),
  ];
  let states = new Map<
    string,
    { chosen: number[]; assignments: number[]; points: number; benchSelections: number }
  >([['', { chosen: [], assignments: [], points: 0, benchSelections: 0 }]]);
  for (const slot of slots) {
    const next = new Map<
      string,
      { chosen: number[]; assignments: number[]; points: number; benchSelections: number }
    >();
    for (const state of states.values())
      for (let index = 0; index < candidates.length; index++) {
        const player = candidates[index];
        if (state.chosen.includes(index) || !slot.accepts(player.position, player.id)) continue;
        const chosen = [...state.chosen, index].sort((a, b) => a - b);
        const candidate = {
          chosen,
          assignments: [...state.assignments, index],
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
  return {
    ...best,
    assignedPlayerIds: best.assignments.map((index) => candidates[index].id),
    playerIds: best.chosen.map((index) => candidates[index].id),
  };
}

export const sleeperSlot = (slot: string): Slot | undefined => {
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
  byeWeekByPlayer: Record<string, number> = {},
): PlayoffProjection {
  const pointsByPlayer = new Map(
    projections
      .filter((row): row is SleeperProjectionRow & { player_id: string } => !!row.player_id)
      .map((row) => [
        row.player_id,
        Object.entries(row.stats || {}).some(
          ([stat, value]) => Number.isFinite(scoring[stat]) && Number.isFinite(value),
        )
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
  const lineups: Record<string, string[]> = {};
  let coveredStarters = 0;
  let totalStarters = 0;
  let benchSelections = 0;
  let unavailablePlayers = 0;
  let uncertainPlayers = 0;
  let byePlayers = 0;
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
      .map((id) => {
        const bye = byeWeekByPlayer[id] === week;
        if (bye) byePlayers++;
        return {
          id,
          position: playerPositions[id] || '',
          points: bye ? 0 : (pointsByPlayer.get(id) ?? Number.NaN),
          starter: starters.has(id),
        };
      })
      .filter((player) => !!player.position);
    const lineup = bestProjectedLineup(players, slots);
    if (!lineup) continue;
    teamPoints[teamId] = lineup.points;
    lineups[teamId] = lineup.playerIds;
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
    byePlayers,
    lineups,
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
      proTeamId?: number;
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
  options: {
    useCurrentAvailability?: boolean;
    byeWeekByProTeam?: Record<string, number>;
    ownership?: EspnProjectionSide[];
  } = {},
): PlayoffProjection {
  const teamPoints: Record<string, number> = {};
  const lineups: Record<string, string[]> = {};
  let coveredStarters = 0;
  let totalStarters = 0;
  let benchSelections = 0;
  let unavailablePlayers = 0;
  let uncertainPlayers = 0;
  let availabilityChecked = false;
  let byePlayers = 0;
  for (const teamId of teamIds) {
    const projectedEntries =
      sides.find((side) => String(side.teamId) === teamId)?.rosterForCurrentScoringPeriod
        ?.entries || [];
    const owned = options.ownership?.find((side) => String(side.teamId) === teamId)
      ?.rosterForCurrentScoringPeriod?.entries;
    const entries =
      owned?.map((entry) => {
        const id = entry.playerId ?? entry.playerPoolEntry?.player?.id;
        const projected = projectedEntries.find(
          (candidate) => (candidate.playerId ?? candidate.playerPoolEntry?.player?.id) === id,
        );
        return projected ? { ...projected, lineupSlotId: entry.lineupSlotId } : entry;
      }) ?? (options.ownership ? [] : projectedEntries);
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
        const status =
          options.useCurrentAvailability === false
            ? undefined
            : entry.playerPoolEntry?.player?.injuryStatus;
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
        const bye = options.byeWeekByProTeam?.[String(player?.proTeamId)] === week;
        if (bye) byePlayers++;
        return {
          id: String(id),
          position: espnPosition(player?.defaultPositionId) || '',
          points: bye
            ? 0
            : (player?.stats?.find(
                (stat) =>
                  stat.seasonId === year &&
                  stat.scoringPeriodId === week &&
                  stat.statSourceId === 1 &&
                  stat.statSplitTypeId === 1 &&
                  Number.isFinite(stat.appliedTotal),
              )?.appliedTotal ?? Number.NaN),
          starter: entry.lineupSlotId !== 20,
        };
      })
      .filter((player) => player.id !== 'undefined' && !!player.position);
    const lineup = bestProjectedLineup(players, slots as Slot[]);
    if (!lineup) continue;
    teamPoints[teamId] = lineup.points;
    lineups[teamId] = lineup.playerIds;
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
    byePlayers,
    lineups,
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

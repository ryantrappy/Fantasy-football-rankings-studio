import type { SeasonResult } from '../../insights';
export interface BracketMatch {
  p?: number;
  t1?: number | null | object;
  t2?: number | null | object;
  w?: number | null;
  l?: number | null;
  t1_from?: { w?: number; l?: number };
  t2_from?: { w?: number; l?: number };
}
const members = (bracket: BracketMatch[]) =>
  new Set(
    bracket
      .flatMap((m) => [m.t1, m.t2])
      .filter((id): id is number => typeof id === 'number' && id > 0)
      .map(String),
  );
const empty = (teamId: string): SeasonResult => ({
  teamId,
  playoff: null,
  finish: null,
  champion: null,
  lastPlace: null,
});
export function sleeperResults(
  teamIds: string[],
  playoffTeams: number | undefined,
  complete: boolean,
  winners: BracketMatch[],
  losers: BracketMatch[],
): SeasonResult[] {
  const rows = teamIds.map(empty),
    playoff = members(winners),
    consolation = members(losers);
  const validMembers = (set: Set<string>) => [...set].every((id) => teamIds.includes(id));
  if (playoffTeams && playoff.size === playoffTeams && validMembers(playoff))
    rows.forEach((row) => {
      row.playoff = playoff.has(row.teamId);
    });
  if (!complete) return rows;
  const finishes = new Map<string, number>();
  const assign = (id: number | null | undefined, rank: number) => {
    if (
      id &&
      teamIds.includes(String(id)) &&
      Number.isInteger(rank) &&
      rank >= 1 &&
      rank <= teamIds.length
    )
      finishes.set(String(id), rank);
  };
  for (const match of winners) {
    if (
      !match.p ||
      !match.w ||
      !match.l ||
      match.w === match.l ||
      !playoff.has(String(match.w)) ||
      !playoff.has(String(match.l))
    )
      continue;
    assign(match.w, match.p);
    assign(match.l, match.p + 1);
  }
  // Do not guess the numeric playoff_type enum. The placement final explicitly
  // tells us whether game winners or losers progress through this bracket.
  const final = losers.find((m) => m.p === 1);
  const progression = [final?.t1_from, final?.t2_from].filter(Boolean);
  const toilet = progression.length === 2 && progression.every((p) => p?.l != null);
  const normal = progression.length === 2 && progression.every((p) => p?.w != null);
  if (
    validMembers(consolation) &&
    ![...consolation].some((id) => playoff.has(id)) &&
    (toilet || normal)
  ) {
    for (const match of losers) {
      if (
        !match.p ||
        !match.w ||
        !match.l ||
        match.w === match.l ||
        !consolation.has(String(match.w)) ||
        !consolation.has(String(match.l))
      )
        continue;
      if (toilet) {
        assign(match.l, teamIds.length - match.p + 1);
        assign(match.w, teamIds.length - match.p);
      } else {
        const offset = teamIds.length - consolation.size;
        assign(match.w, offset + match.p);
        assign(match.l, offset + match.p + 1);
      }
    }
  }
  // Conflicting ranks are not reliable finishes.
  for (const row of rows) {
    const rank = finishes.get(row.teamId);
    row.finish =
      rank && [...finishes.values()].filter((r) => r === rank).length === 1 ? rank : null;
  }
  const champion = rows.find((r) => r.finish === 1),
    last = rows.find((r) => r.finish === teamIds.length);
  for (const row of rows) {
    row.champion = champion ? row === champion : null;
    row.lastPlace = last ? row === last : null;
  }
  return rows;
}
export interface EspnResultsData {
  teams?: { id: number; rankCalculatedFinal?: number }[];
  schedule?: { playoffTierType?: string; home?: { teamId: number }; away?: { teamId: number } }[];
  settings?: {
    scheduleSettings?: {
      playoffTeamCount?: number;
      matchupPeriodCount?: number;
      matchupPeriodLength?: number;
    };
  };
}
export function espnResults(
  teamIds: string[],
  data: EspnResultsData,
  complete: boolean,
  playoffsStarted: boolean,
): SeasonResult[] {
  const rows = teamIds.map(empty);
  if (!playoffsStarted && !complete) return rows;
  const playoff = new Set(
    (data.schedule || [])
      .filter((m) => m.playoffTierType === 'WINNERS_BRACKET')
      .flatMap((m) => [m.home?.teamId, m.away?.teamId])
      .filter((id) => id != null)
      .map(String),
  );
  if (
    playoff.size &&
    playoff.size === data.settings?.scheduleSettings?.playoffTeamCount &&
    [...playoff].every((id) => teamIds.includes(id))
  )
    rows.forEach((row) => {
      row.playoff = playoff.has(row.teamId);
    });
  if (!complete) return rows;
  for (const row of rows) {
    const rank = data.teams?.find((t) => String(t.id) === row.teamId)?.rankCalculatedFinal;
    if (
      rank &&
      Number.isInteger(rank) &&
      rank >= 1 &&
      rank <= teamIds.length &&
      data.teams?.filter((t) => t.rankCalculatedFinal === rank).length === 1
    )
      row.finish = rank;
  }
  const champion = rows.find((r) => r.finish === 1),
    last = rows.find((r) => r.finish === teamIds.length);
  rows.forEach((row) => {
    row.champion = champion ? row === champion : null;
    row.lastPlace = last ? row === last : null;
  });
  return rows;
}

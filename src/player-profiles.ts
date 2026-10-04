import type { SeasonInsights } from './insights';
import type { LiveLeague, LivePlayer } from './live-matchups';
import type { WaiverPool } from './waivers';
export interface PlayerProfile {
  id: string;
  key: string;
  name: string;
  position?: string;
  observed: Record<number, number>;
  projection?: number;
  projectionWeek?: number;
  ownership: string;
  availability?: string | null;
  bye?: boolean;
  reportAt?: string;
  rosterAt?: string;
  projectionSources?: LivePlayer['projectionSources'];
  projectionSpread?: number;
  projectionNote?: string;
}
export function playerProfiles(
  provider: 'Sleeper' | 'ESPN',
  season: number,
  report?: SeasonInsights,
  live?: LiveLeague,
  pool?: WaiverPool,
): PlayerProfile[] {
  const players = new Map<string, PlayerProfile>();
  function profile(id: string) {
    if (!players.has(id))
      players.set(id, {
        id,
        key: `${provider}:${season}:${id}`,
        name: `Player ${id}`,
        observed: {},
        ownership: 'Unavailable',
        reportAt: report?.generatedAt,
      });
    return players.get(id)!;
  }
  const observations = new Map<string, number[]>();
  for (const score of report?.scores ?? [])
    for (const player of score.players ?? []) {
      if (!Number.isFinite(player.points)) continue;
      const key = `${player.playerId}:${score.week}`;
      observations.set(key, [...(observations.get(key) ?? []), player.points]);
      profile(player.playerId);
    }
  for (const [id, player] of players)
    for (let week = 1; week <= 18; week++) {
      const values = observations.get(`${id}:${week}`);
      if (values?.length && values.every((value) => value === values[0]))
        player.observed[week] = values[0];
    }
  const owners = new Map<string, Set<string>>();
  for (const team of live?.matchups.flatMap((matchup) => [
    matchup.home,
    ...(matchup.away ? [matchup.away] : []),
  ]) ?? [])
    for (const player of team.players) {
      assign(profile(player.id), player, live!.week, live!.capturedAt);
      if (player.owned) {
        const owned = owners.get(player.id) ?? new Set<string>();
        owned.add(team.name);
        owners.set(player.id, owned);
      }
    }
  for (const candidate of pool?.candidates ?? []) {
    const player = profile(candidate.id);
    assign(player, candidate, pool!.week ?? undefined, pool!.capturedAt);
    player.ownership =
      pool?.ownership?.covered === pool?.ownership?.expected
        ? 'Unowned at verified pool snapshot; waiver restrictions may apply'
        : 'Unavailable';
  }
  for (const [id, teams] of owners)
    profile(id).ownership =
      teams.size === 1 ? [...teams][0] : 'Ambiguous ownership; refresh provider data';
  return [...players.values()].sort(
    (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  );
}
function assign(profile: PlayerProfile, player: LivePlayer, week?: number, capturedAt?: string) {
  profile.name = player.name;
  profile.position = player.position;
  profile.projection = Number.isFinite(player.projectedPoints) ? player.projectedPoints : undefined;
  profile.projectionWeek = week;
  profile.availability = player.availability;
  profile.bye = player.bye;
  profile.rosterAt = capturedAt;
  profile.projectionSources = player.projectionSources;
  profile.projectionSpread = player.projectionSpread;
  profile.projectionNote = player.projectionNote;
}
export function comparePlayerRange(profile: PlayerProfile, first: number, last: number) {
  const weeks = Array.from(
    { length: Math.max(0, Math.min(18, last) - Math.max(1, first) + 1) },
    (_, index) => Math.max(1, first) + index,
  );
  const points = weeks.flatMap((week) =>
    Number.isFinite(profile.observed[week]) ? [profile.observed[week]] : [],
  );
  return {
    weeks: weeks.map((week) => ({ week, points: profile.observed[week] ?? null })),
    covered: points.length,
    expected: weeks.length,
    total: points.length ? points.reduce((sum, value) => sum + value, 0) : null,
    average: points.length ? points.reduce((sum, value) => sum + value, 0) / points.length : null,
  };
}

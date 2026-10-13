import type { SeasonRecord } from '../../league-summary';
export const managerKey = (team: { teamId: string; managerKey?: string }, year: number) =>
  team.managerKey || `unidentified:${year}:${team.teamId}`;
export interface Competitor {
  key: string;
  name: string;
  teamId: string;
  points: number;
}
export interface Game {
  id: string;
  year: number;
  week: number;
  a: Competitor;
  b: Competitor;
  phase: 'regular' | 'playoff' | 'unknown';
  weeks: number[];
}
export const result = (a: number, b: number) => (a > b ? 1 : a === b ? 0.5 : 0);
export function competitionGames(records: SeasonRecord[]) {
  const games: Game[] = [];
  const managers = new Map<string, string>();
  let skipped = 0;
  for (const { year, data } of [...records].sort((a, b) => a.year - b.year)) {
    const teams = new Map(data.teams.map((t) => [t.teamId, t]));
    data.teams.forEach((t) => managers.set(managerKey(t, year), t.managerName));
    const scores = data.scores.filter(
      (s) => s.week <= data.completedWeek && Number.isFinite(s.actual),
    );
    const postseason = (data.playoffGames ?? []).filter(
      (g) =>
        g.weeks.length > 0 &&
        g.weeks.every((w) => w <= data.completedWeek) &&
        Number.isFinite(g.homePoints) &&
        Number.isFinite(g.awayPoints),
    );
    for (const g of postseason) {
      const a = teams.get(g.homeTeamId),
        b = teams.get(g.awayTeamId);
      if (!a || !b || a === b || games.some((x) => x.id === `${year}:${g.id}`)) continue;
      games.push({
        id: `${year}:${g.id}`,
        year,
        week: Math.max(...g.weeks),
        weeks: g.weeks,
        phase: 'playoff',
        a: {
          key: managerKey(a, year),
          name: a.managerName,
          teamId: a.teamId,
          points: g.homePoints,
        },
        b: {
          key: managerKey(b, year),
          name: b.managerName,
          teamId: b.teamId,
          points: g.awayPoints,
        },
      });
    }
    for (const s of scores) {
      if (
        postseason.some(
          (g) => g.weeks.includes(s.week) && [g.homeTeamId, g.awayTeamId].includes(s.teamId),
        )
      )
        continue;
      if (!s.opponentTeamId) continue;
      const peers = scores.filter((o) => o.week === s.week && o.teamId === s.opponentTeamId);
      const own = scores.filter((o) => o.week === s.week && o.teamId === s.teamId);
      const o = peers[0];
      const a = teams.get(s.teamId),
        b = teams.get(s.opponentTeamId);
      if (
        own.length !== 1 ||
        peers.length !== 1 ||
        o.opponentTeamId !== s.teamId ||
        !a ||
        !b ||
        a === b
      ) {
        skipped++;
        continue;
      }
      if (s.teamId.localeCompare(o.teamId) >= 0) continue;
      const end = data.regularSeasonSchedule?.endWeek ?? data.playoffSettings?.regularSeasonEnd;
      games.push({
        id: `${year}:${s.week}:${s.teamId}:${o.teamId}`,
        year,
        week: s.week,
        weeks: [s.week],
        a: { key: managerKey(a, year), name: a.managerName, teamId: a.teamId, points: s.actual },
        b: { key: managerKey(b, year), name: b.managerName, teamId: b.teamId, points: o.actual },
        phase: end && s.week <= end ? 'regular' : 'unknown',
      });
    }
    skipped += data.scores.filter(
      (s) => s.week <= data.completedWeek && !Number.isFinite(s.actual),
    ).length;
  }
  return {
    games: games.sort((a, b) => a.year - b.year || a.week - b.week || a.id.localeCompare(b.id)),
    managers,
    skipped,
  };
}
export function pairRecord(games: Game[], key: string, opponent: string) {
  const rows = games.filter(
    (g) => (g.a.key === key && g.b.key === opponent) || (g.b.key === key && g.a.key === opponent),
  );
  let wins = 0,
    losses = 0,
    ties = 0,
    pointsFor = 0,
    pointsAgainst = 0;
  for (const g of rows) {
    const [a, b] = g.a.key === key ? [g.a, g.b] : [g.b, g.a];
    pointsFor += a.points;
    pointsAgainst += b.points;
    if (a.points > b.points) wins++;
    else if (a.points < b.points) losses++;
    else ties++;
  }
  return {
    opponent,
    games: rows.length,
    wins,
    losses,
    ties,
    pointsFor,
    pointsAgainst,
    rate: rows.length ? (wins + ties / 2) / rows.length : null,
    margin: rows.length ? (pointsFor - pointsAgainst) / rows.length : null,
  };
}
export function rivalryLabels(rows: ReturnType<typeof pairRecord>[], minimum: number) {
  const eligible = rows.filter((r) => r.games >= minimum);
  const stable = (a: (typeof rows)[number], b: (typeof rows)[number]) =>
    a.opponent.localeCompare(b.opponent);
  return {
    rival: [...eligible].sort(
      (a, b) =>
        Math.abs(a.rate! - 0.5) - Math.abs(b.rate! - 0.5) || b.games - a.games || stable(a, b),
    )[0],
    punchingBag: [...eligible]
      .filter((r) => r.rate! > 0.5)
      .sort((a, b) => b.rate! - a.rate! || b.games - a.games || stable(a, b))[0],
    kryptonite: [...eligible]
      .filter((r) => r.rate! < 0.5)
      .sort((a, b) => a.rate! - b.rate! || b.games - a.games || stable(a, b))[0],
  };
}

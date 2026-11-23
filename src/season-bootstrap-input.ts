import type { SeasonInsights } from './insights';
import { lineupSlotForLabel } from './lineup-advisor';
import type { LiveLeague } from './live-matchups';
import { bootstrapLineup, type BootstrapLeague, type BootstrapPlayer } from './season-bootstrap';

const positionKey = (position?: string) => position?.toUpperCase().replace(/^DEF$/, 'DST');
const average = (scores: number[]) => scores.reduce((sum, value) => sum + value, 0) / scores.length;

function leagueSchedule(report: SeasonInsights, teamIds: string[], weeks: number) {
  const schedule = report.regularSeasonSchedule;
  if (!schedule || schedule.endWeek !== weeks) return undefined;
  const rounds: NonNullable<BootstrapLeague['schedule']> = [];
  for (let week = 1; week <= weeks; week++) {
    const seen = new Set<number>();
    const games: (typeof rounds)[number] = [];
    for (const game of schedule.fixtures.filter((fixture) => fixture.week === week)) {
      const a = teamIds.indexOf(game.homeTeamId);
      const b = game.awayTeamId === null ? null : teamIds.indexOf(game.awayTeamId);
      if (a < 0 || b === -1 || a === b || seen.has(a) || (b !== null && seen.has(b)))
        return undefined;
      seen.add(a);
      if (b !== null) seen.add(b);
      games.push([a, b]);
    }
    if (seen.size !== teamIds.length || !games.some(([, b]) => b !== null)) return undefined;
    rounds.push(games.sort(([a], [b]) => a - b));
  }
  return rounds;
}

export function buildBootstrapLeague(
  report: SeasonInsights,
  live: LiveLeague,
  historyYear: number,
  expectedTeamIds = report.teams.map(({ teamId }) => teamId),
) {
  const labels = live.lineupSlots ?? [];
  const slots = labels.map(lineupSlotForLabel);
  if (live.error) throw new Error(live.error);
  if (
    !slots.length ||
    slots.length > 24 ||
    slots.some((slot) => !slot) ||
    labels.some((label) => label.startsWith('Unsupported'))
  )
    throw new Error('The provider’s starting lineup rules are unavailable or unsupported.');

  const liveTeams = live.matchups.flatMap(({ home, away }) => (away ? [home, away] : [home]));
  const teams = [...new Map(liveTeams.map((team) => [team.teamId, team])).values()].sort((a, b) =>
    a.teamId.localeCompare(b.teamId),
  );
  if (teams.length < 2 || teams.length > 32)
    throw new Error('A current roster snapshot for a league of 2 to 32 teams is required.');
  if (
    teams.length !== expectedTeamIds.length ||
    expectedTeamIds.some((id) => !teams.some((team) => team.teamId === id))
  )
    throw new Error('The current roster snapshot does not cover every team.');

  const weeks = report.regularSeasonSchedule?.endWeek ?? report.playoffSettings?.regularSeasonEnd;
  if (!weeks || !Number.isInteger(weeks) || weeks < 1 || weeks > 18)
    throw new Error('The regular-season length is unavailable. Select another history season.');

  const positions = new Map(
    Object.entries(report.playerIdentities ?? {}).flatMap(([id, info]) =>
      info.position ? [[id, positionKey(info.position)!] as const] : [],
    ),
  );
  for (const score of report.scores)
    for (const starter of score.starters)
      if (starter.position && score.week <= report.completedWeek && score.week <= weeks)
        positions.set(starter.playerId, positionKey(starter.position)!);
  for (const team of teams)
    for (const player of team.players)
      if (player.position && !positions.has(player.id))
        positions.set(player.id, positionKey(player.position)!);

  const observations = new Map<string, Map<number, number | null>>();
  for (const row of report.scores) {
    if (
      row.week < 1 ||
      row.week > report.completedWeek ||
      row.week > weeks ||
      (row.matchupWeeks?.length ?? 0) > 1
    )
      continue;
    for (const { playerId, points } of [...row.starters, ...(row.players ?? [])]) {
      if (!positions.has(playerId) || !Number.isFinite(points)) continue;
      let scores = observations.get(playerId);
      if (!scores) observations.set(playerId, (scores = new Map()));
      if (!scores.has(row.week)) scores.set(row.week, points);
      else if (scores.get(row.week) !== points) scores.set(row.week, null);
    }
  }

  const rankings = new Map<string, { id: string; scores: number[]; mean: number }[]>();
  let sampleCount = 0;
  const sampleWeeks = new Set<number>();
  for (const [id, byWeek] of observations) {
    const scores: number[] = [];
    for (const [week, points] of [...byWeek].sort(([a], [b]) => a - b)) {
      if (points === null) continue;
      scores.push(points);
      sampleWeeks.add(week);
    }
    if (!scores.length) continue;
    sampleCount += scores.length;
    const position = positions.get(id)!;
    const peers = rankings.get(position) ?? [];
    peers.push({ id, scores, mean: average(scores) });
    rankings.set(position, peers);
  }
  if (sampleWeeks.size < 2)
    throw new Error(
      'At least two completed weeks of player scores are needed. Select another history season.',
    );
  for (const peers of rankings.values())
    peers.sort((a, b) => b.mean - a.mean || a.id.localeCompare(b.id));

  let positionalPlayers = 0;
  let excludedPlayers = 0;
  const rosterTeams = teams.map((team) => {
    const players: BootstrapPlayer[] = [];
    const roster = new Map(
      team.players
        .filter((player) => player.id && player.owned !== false && !player.reserve)
        .map((player) => [player.id, player]),
    );
    for (const player of roster.values()) {
      const position = positionKey(player.position) ?? positions.get(player.id);
      const peers = position ? rankings.get(position) : undefined;
      const eligibility = slots.flatMap((slot, i) =>
        (
          player.eligibleSlots?.length
            ? player.eligibleSlots.includes(labels[i])
            : slot?.accepts(position ?? '')
        )
          ? [i]
          : [],
      );
      if (!position || !peers?.length || !eligibility.length) {
        excludedPlayers++;
        continue;
      }
      const rank = peers.findIndex(({ id }) => id === player.id);
      if (rank === -1) positionalPlayers++;
      // Widen a player's observed positional rank by up to two neighboring ranks.
      // Unobserved roster members draw from the lowest five ranks at their position.
      const pool = rank === -1 ? peers.slice(-5) : peers.slice(Math.max(0, rank - 2), rank + 3);
      players.push({
        id: player.id,
        name: player.name,
        position,
        slots: eligibility,
        scores: pool.flatMap((peer) => peer.scores),
      });
    }
    players.sort((a, b) => a.id.localeCompare(b.id));
    if (
      bootstrapLineup(
        players,
        players.map(() => 0),
        slots.length,
      ).filled !== slots.length
    )
      throw new Error(
        `${team.name} cannot fill a legal starting lineup with the available player history.`,
      );
    return { id: team.teamId, name: team.name, players };
  });

  const league: BootstrapLeague = {
    teams: rosterTeams,
    slotCount: slots.length,
    weeks,
    schedule:
      live.season === historyYear
        ? leagueSchedule(
            report,
            rosterTeams.map(({ id }) => id),
            weeks,
          )
        : undefined,
  };
  return { league, sampleCount, sampleWeeks: sampleWeeks.size, positionalPlayers, excludedPlayers };
}

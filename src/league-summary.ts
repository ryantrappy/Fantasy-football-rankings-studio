import type { SeasonInsights } from './insights';
export interface SeasonRecord {
  year: number;
  data: SeasonInsights;
}
export interface ManagerSummary {
  key: string;
  managerName: string;
  teamName: string;
  seasons: number[];
  playoffAppearances: number;
  playoffSeasons: number;
  championships: number;
  championshipSeasons: number;
  lastPlaces: number;
  lastPlaceSeasons: number;
  regularSeasonFinishTotal: number;
  regularSeasonFinishSeasons: number;
  finishTotal: number;
  finishSeasons: number;
  weeks: number;
  totalPoints: number;
  aboveMedian: number;
  medianPercentTotal: number;
  medianWeeks: number;
  allPlayWins: number;
  allPlayGames: number;
  luckGames: number;
  actualWins: number;
  expectedWins: number;
  trades: number;
  gradedTrades: number;
  tradeWins: number;
  tradeLosses: number;
  tradeTies: number;
  tradeGainTotal: number;
  pickups: number;
  ratedPickups: number;
  pickupHits: number;
  pickupLiftTotal: number;
  measuredSurplus: number;
  bestWeek: { year: number; week: number; points: number; vsMedian: number } | null;
}
export const average = (total: number, count: number) => (count ? total / count : null);
export const percentage = (part: number, total: number) => (total ? (part / total) * 100 : null);
const median = (values: number[]) => {
  const rows = [...values].sort((a, b) => a - b),
    mid = Math.floor(rows.length / 2);
  return rows.length % 2 ? rows[mid] : (rows[mid - 1] + rows[mid]) / 2;
};
const regularSeasonPlacements = (data: SeasonInsights) => {
  const end = data.playoffSettings?.regularSeasonEnd;
  if (!end || data.completedWeek < end || !data.teams.length) return new Map<string, number>();
  const scoreByWeekAndTeam = new Map(
    data.scores
      .filter((score) => score.week <= end)
      .map((score) => [`${score.week}:${score.teamId}`, score]),
  );
  const standings = data.teams.map((team) => ({ teamId: team.teamId, wins: 0, points: 0 }));
  for (const standing of standings)
    for (let week = 1; week <= end; week++) {
      const score = scoreByWeekAndTeam.get(`${week}:${standing.teamId}`);
      if (!score) return new Map<string, number>();
      standing.points += score.actual;
      if (!score.opponentTeamId) continue;
      const opponent = scoreByWeekAndTeam.get(`${week}:${score.opponentTeamId}`);
      if (!opponent || opponent.opponentTeamId !== standing.teamId)
        return new Map<string, number>();
      standing.wins +=
        score.actual > opponent.actual ? 1 : score.actual === opponent.actual ? 0.5 : 0;
    }
  standings.sort(
    (a, b) => b.wins - a.wins || b.points - a.points || a.teamId.localeCompare(b.teamId),
  );
  const placements = new Map<string, number>();
  let placement = 0;
  standings.forEach((standing, index) => {
    const previous = standings[index - 1];
    if (!previous || previous.wins !== standing.wins || previous.points !== standing.points)
      placement = index + 1;
    placements.set(standing.teamId, placement);
  });
  return placements;
};
export function summarizeLeague(records: SeasonRecord[]): ManagerSummary[] {
  const summaries = new Map<string, ManagerSummary>();
  // Ascending order keeps the latest name while preserving identity and per-season denominators.
  for (const { year, data } of [...records].sort((a, b) => a.year - b.year)) {
    const regularSeason = regularSeasonPlacements(data);
    for (const team of data.teams) {
      const key = team.managerKey || `unidentified:${year}:${team.teamId}`;
      let row = summaries.get(key);
      if (!row) {
        row = {
          key,
          managerName: team.managerName,
          teamName: team.teamName,
          seasons: [],
          playoffAppearances: 0,
          playoffSeasons: 0,
          championships: 0,
          championshipSeasons: 0,
          lastPlaces: 0,
          lastPlaceSeasons: 0,
          regularSeasonFinishTotal: 0,
          regularSeasonFinishSeasons: 0,
          finishTotal: 0,
          finishSeasons: 0,
          weeks: 0,
          totalPoints: 0,
          aboveMedian: 0,
          medianPercentTotal: 0,
          medianWeeks: 0,
          allPlayWins: 0,
          allPlayGames: 0,
          luckGames: 0,
          actualWins: 0,
          expectedWins: 0,
          trades: 0,
          gradedTrades: 0,
          tradeWins: 0,
          tradeLosses: 0,
          tradeTies: 0,
          tradeGainTotal: 0,
          pickups: 0,
          ratedPickups: 0,
          pickupHits: 0,
          pickupLiftTotal: 0,
          measuredSurplus: 0,
          bestWeek: null,
        };
        summaries.set(key, row);
      }
      row.managerName = team.managerName;
      row.teamName = team.teamName;
      if (!row.seasons.includes(year)) row.seasons.push(year);
      const result = data.results?.find((r) => r.teamId === team.teamId);
      if (result?.playoff != null) {
        row.playoffSeasons++;
        if (result.playoff) row.playoffAppearances++;
      }
      if (result?.champion != null) {
        row.championshipSeasons++;
        if (result.champion) row.championships++;
      }
      if (result?.lastPlace != null) {
        row.lastPlaceSeasons++;
        if (result.lastPlace) row.lastPlaces++;
      }
      if (result?.finish != null) {
        row.finishSeasons++;
        row.finishTotal += result.finish;
      }
      const regularSeasonFinish = regularSeason.get(team.teamId);
      if (regularSeasonFinish != null) {
        row.regularSeasonFinishSeasons++;
        row.regularSeasonFinishTotal += regularSeasonFinish;
      }
      for (const score of data.scores.filter(
        (s) => s.teamId === team.teamId && s.week <= data.completedWeek,
      )) {
        const peers = data.scores.filter(
          (s) => s.week === score.week && s.week <= data.completedWeek,
        );
        const baseline = median(peers.map((s) => s.actual));
        row.weeks++;
        row.totalPoints += score.actual;
        if (score.actual > baseline) row.aboveMedian++;
        if (baseline > 0) {
          const relative = ((score.actual - baseline) / baseline) * 100;
          row.medianPercentTotal += relative;
          row.medianWeeks++;
          if (!row.bestWeek || relative > row.bestWeek.vsMedian)
            row.bestWeek = { year, week: score.week, points: score.actual, vsMedian: relative };
        }
        const opponents = peers.filter((s) => s.teamId !== team.teamId);
        const scheduled = opponents.find(
          (s) => s.teamId === score.opponentTeamId && s.opponentTeamId === team.teamId,
        );
        if (scheduled && peers.length === data.teams.length) {
          row.luckGames++;
          row.actualWins +=
            score.actual > scheduled.actual ? 1 : score.actual === scheduled.actual ? 0.5 : 0;
          row.expectedWins +=
            opponents.reduce(
              (sum, p) => sum + (score.actual > p.actual ? 1 : score.actual === p.actual ? 0.5 : 0),
              0,
            ) / opponents.length;
        }
        for (const peer of peers.filter((s) => s.teamId !== team.teamId)) {
          row.allPlayGames++;
          row.allPlayWins +=
            score.actual > peer.actual ? 1 : score.actual === peer.actual ? 0.5 : 0;
        }
      }
      for (const trade of data.tradeComparisons) {
        const side = trade.sides.find((s) => s.teamId === team.teamId);
        if (!side) continue;
        row.trades++;
        if ((trade.verdict === 'leader' || trade.verdict === 'close') && side.gain !== null) {
          row.gradedTrades++;
          row.tradeGainTotal += side.gain;
          if (trade.verdict === 'close') row.tradeTies++;
          else if (trade.winner === team.teamId) row.tradeWins++;
          else row.tradeLosses++;
        }
      }
      for (const pickup of data.pickups.filter((p) => p.teamId === team.teamId)) {
        row.pickups++;
        if (pickup.lift !== null) {
          row.ratedPickups++;
          row.pickupLiftTotal += pickup.lift;
          row.measuredSurplus += pickup.lift * pickup.comparisonWeeks.length;
          if (pickup.lift > 0) row.pickupHits++;
        }
      }
    }
  }
  return [...summaries.values()].sort((a, b) => a.managerName.localeCompare(b.managerName));
}

export const luckIndex = (row: ManagerSummary) =>
  percentage(row.actualWins - row.expectedWins, row.luckGames);
export const visibleManagers = (
  rows: ManagerSummary[],
  active: string[],
  includeFormer: boolean,
) => (includeFormer ? rows : rows.filter((row) => active.includes(row.key)));

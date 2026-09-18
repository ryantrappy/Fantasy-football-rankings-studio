import type { SeasonRecord } from './league-summary';

export interface ManagerComparisonSummary {
  key: string;
  managerName: string;
  teamName: string;
  averagePoints: number | null;
  averageVsMedian: number | null;
  aboveMedian: number;
  weeks: number;
  playoffs: number;
  playoffSeasons: number;
  championships: number;
  championshipSeasons: number;
  finishTotal: number;
  finishSeasons: number;
}

export interface ManagerComparisonSeason {
  year: number;
  commonWeeks: number[];
  description: string;
  comparable: boolean;
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export const managerComparisonKey = (team: { teamId: string; managerKey?: string }, year: number) =>
  team.managerKey || `unidentified:${year}:${team.teamId}`;

export function compareManagers(
  records: SeasonRecord[],
  selectedYears: number[],
  managerKeys: [string, string],
) {
  const recordByYear = new Map(records.map((record) => [record.year, record]));
  const identities = new Map<string, { managerName: string; teamName: string }>();
  for (const record of [...records].sort((a, b) => a.year - b.year))
    for (const team of record.data.teams) {
      const key = managerComparisonKey(team, record.year);
      identities.set(key, {
        managerName: team.managerName,
        teamName: team.teamName,
      });
    }
  const summaries = managerKeys.map((key): ManagerComparisonSummary => {
    const identity = identities.get(key);
    return {
      key,
      managerName: identity?.managerName || 'Unknown manager',
      teamName: identity?.teamName || 'Unknown team',
      averagePoints: null,
      averageVsMedian: null,
      aboveMedian: 0,
      weeks: 0,
      playoffs: 0,
      playoffSeasons: 0,
      championships: 0,
      championshipSeasons: 0,
      finishTotal: 0,
      finishSeasons: 0,
    };
  }) as [ManagerComparisonSummary, ManagerComparisonSummary];
  const pointTotals = [0, 0];
  const medianTotals = [0, 0];
  const medianWeeks = [0, 0];
  const seasons: ManagerComparisonSeason[] = [];

  for (const year of [...selectedYears].sort((a, b) => b - a)) {
    const record = recordByYear.get(year);
    if (!record) {
      seasons.push({
        year,
        commonWeeks: [],
        comparable: false,
        description: 'Season data is unavailable and is excluded from the comparison.',
      });
      continue;
    }
    const teams = managerKeys.map((key) =>
      record.data.teams.find((team) => managerComparisonKey(team, year) === key),
    );
    const absent = teams.flatMap((team, index) => (team ? [] : [summaries[index].managerName]));
    if (absent.length) {
      seasons.push({
        year,
        commonWeeks: [],
        comparable: false,
        description: `${absent.join(' and ')} did not manage under the selected ownership group this season.`,
      });
      continue;
    }
    const scores = teams.map(
      (team) =>
        new Map(
          record.data.scores
            .filter(
              (score) => score.teamId === team!.teamId && score.week <= record.data.completedWeek,
            )
            .map((score) => [score.week, score]),
        ),
    );
    const commonWeeks = [...scores[0].keys()]
      .filter((week) => scores[1].has(week))
      .sort((a, b) => a - b);
    seasons.push({
      year,
      commonWeeks,
      comparable: true,
      description: commonWeeks.length
        ? `${commonWeeks.length} shared completed week${commonWeeks.length === 1 ? '' : 's'} (${commonWeeks.join(', ')}).`
        : 'Both ownership groups appear, but they have no shared completed scoring weeks.',
    });
    for (const [index, team] of teams.entries()) {
      for (const week of commonWeeks) {
        const actual = scores[index].get(week)!.actual;
        const peers = record.data.scores.filter(
          (score) => score.week === week && score.week <= record.data.completedWeek,
        );
        pointTotals[index] += actual;
        summaries[index].weeks++;
        const baseline = median(peers.map((score) => score.actual));
        if (actual > baseline) summaries[index].aboveMedian++;
        if (baseline > 0) {
          medianTotals[index] += ((actual - baseline) / baseline) * 100;
          medianWeeks[index]++;
        }
      }
      const result = record.data.results?.find((entry) => entry.teamId === team!.teamId);
      if (result?.playoff != null) {
        summaries[index].playoffSeasons++;
        if (result.playoff) summaries[index].playoffs++;
      }
      if (result?.champion != null) {
        summaries[index].championshipSeasons++;
        if (result.champion) summaries[index].championships++;
      }
      if (result?.finish != null) {
        summaries[index].finishSeasons++;
        summaries[index].finishTotal += result.finish;
      }
    }
  }
  for (const [index, summary] of summaries.entries()) {
    summary.averagePoints = summary.weeks ? pointTotals[index] / summary.weeks : null;
    summary.averageVsMedian = medianWeeks[index] ? medianTotals[index] / medianWeeks[index] : null;
  }
  return { summaries, seasons };
}

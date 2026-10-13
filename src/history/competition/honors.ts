import type { SeasonRecord } from '../../league-summary';
import { competitionGames, managerKey, result } from './games';
import { historicalSchedules } from './schedule';
export const fameWeights = { titles: 40, playoffs: 20, wins: 20, scoring: 15, longevity: 5 };
export function historicalHonors(records: SeasonRecord[]) {
  const { games, managers } = competitionGames(records);
  const regular = games.filter((g) => g.phase === 'regular');
  const rankings = [...managers]
    .map(([key, name]) => {
      const seasons = records.filter((r) =>
        r.data.teams.some((t) => managerKey(t, r.year) === key),
      );
      const outcomes = seasons.flatMap(
        (r) =>
          r.data.results?.filter((s) =>
            r.data.teams.some((t) => t.teamId === s.teamId && managerKey(t, r.year) === key),
          ) ?? [],
      );
      const titleKnown = outcomes.filter((r) => r.champion != null);
      const playoffKnown = outcomes.filter(
        (r) => r.playoff === true && r.finish != null && r.finish > 0,
      );
      const own = regular.filter((g) => g.a.key === key || g.b.key === key);
      const wins = own.reduce(
        (n, g) =>
          n + (g.a.key === key ? result(g.a.points, g.b.points) : result(g.b.points, g.a.points)),
        0,
      );
      const schedule = seasons.flatMap(historicalSchedules).filter((s) => s.key === key);
      const usable = schedule.reduce((n, r) => n + r.weeks, 0);
      const metrics = {
        titles: titleKnown.length
          ? titleKnown.filter((r) => r.champion).length / titleKnown.length
          : null,
        playoffs: playoffKnown.length
          ? playoffKnown.reduce((n, r) => n + 1 / r.finish!, 0) / playoffKnown.length
          : null,
        wins: own.length ? wins / own.length : null,
        scoring: usable ? schedule.reduce((n, r) => n + (r.expected ?? 0), 0) / usable : null,
        longevity: Math.min(seasons.length / 5, 1),
      };
      const available = Object.entries(metrics).filter(([, v]) => v != null);
      const score =
        (available.reduce((n, [k, v]) => n + v! * fameWeights[k as keyof typeof fameWeights], 0) /
          available.reduce((n, [k]) => n + fameWeights[k as keyof typeof fameWeights], 0)) *
        100;
      return {
        key,
        name,
        score,
        seasons: seasons.length,
        titleKnown: titleKnown.length,
        titles: titleKnown.filter((r) => r.champion).length,
        playoffKnown: playoffKnown.length,
        games: own.length,
        scoringWeeks: usable,
        metrics,
      };
    })
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  const shame: {
    id: string;
    kind: string;
    key: string;
    name: string;
    year: number;
    value: number;
    evidence: string;
    sample: number;
  }[] = [];
  for (const r of records)
    for (const t of r.data.teams) {
      const key = managerKey(t, r.year);
      const own = regular.filter((g) => g.year === r.year && (g.a.key === key || g.b.key === key));
      const results = own.map((g) => ({
        g,
        win: g.a.key === key ? result(g.a.points, g.b.points) : result(g.b.points, g.a.points),
      }));
      const end = r.data.regularSeasonSchedule?.endWeek ?? r.data.playoffSettings?.regularSeasonEnd;
      if (end && r.data.completedWeek >= end && results.length === end) {
        shame.push({
          id: `worst:${r.year}:${key}`,
          kind: 'Worst season',
          key,
          name: t.managerName,
          year: r.year,
          value: results.reduce((n, x) => n + x.win, 0) / results.length,
          sample: results.length,
          evidence: results
            .map((x) => `${x.g.week}:${x.win === 1 ? 'W' : x.win === 0 ? 'L' : 'T'}`)
            .join(', '),
        });
      }
      let streak: typeof results = [];
      let longest: typeof results = [];
      for (const x of results) {
        if (x.win !== 0 || (streak.length && x.g.week !== streak.at(-1)!.g.week + 1)) streak = [];
        if (x.win === 0) streak.push(x);
        if (streak.length > longest.length) longest = [...streak];
      }
      if (longest.length)
        shame.push({
          id: `streak:${r.year}:${key}`,
          kind: 'Losing streak',
          key,
          name: t.managerName,
          year: r.year,
          value: longest.length,
          sample: own.length,
          evidence: longest
            .map(
              (x) =>
                `week ${x.g.week} (${x.g.a.name} ${x.g.a.points} vs ${x.g.b.name} ${x.g.b.points})`,
            )
            .join('; '),
        });
      const scores = r.data.scores.filter(
        (s) => s.teamId === t.teamId && s.week <= r.data.completedWeek && Number.isFinite(s.actual),
      );
      const low = [...scores].sort((a, b) => a.actual - b.actual)[0];
      if (low)
        shame.push({
          id: `low:${r.year}:${key}`,
          kind: 'Lowest score',
          key,
          name: t.managerName,
          year: r.year,
          value: low.actual,
          sample: scores.length,
          evidence: `week ${low.week}, ${low.actual} points`,
        });
      const mid = end ? Math.floor(end / 2) : 0;
      const first = results.filter((x) => x.g.week <= mid),
        last = results.filter((x) => x.g.week > mid);
      if (
        end &&
        r.data.completedWeek >= end &&
        results.length === end &&
        first.length >= 2 &&
        last.length >= 2
      ) {
        const drop =
          first.reduce((n, x) => n + x.win, 0) / first.length -
          last.reduce((n, x) => n + x.win, 0) / last.length;
        if (drop > 0)
          shame.push({
            id: `collapse:${r.year}:${key}`,
            kind: 'Biggest collapse',
            key,
            name: t.managerName,
            year: r.year,
            value: drop,
            sample: own.length,
            evidence: `Win-rate drop ${Math.round(drop * 100)}pp; first ${first.length} games vs final ${last.length}: ${results.map((x) => `week ${x.g.week} ${x.win === 1 ? 'W' : x.win === 0 ? 'L' : 'T'}`).join(', ')}`,
          });
      }
    }
  return { rankings, shame };
}

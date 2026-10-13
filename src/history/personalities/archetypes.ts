import type { SeasonRecord } from '../../league-summary';
import { summarizeLeague } from '../../league-summary';
import { transactionActivity } from './activity';
export function managerArchetypes(records: SeasonRecord[]) {
  const activity = transactionActivity(records);
  return summarizeLeague(records).map((manager) => {
    const profiles: { label: string; evidence: string }[] = [];
    const observed = activity.filter(
      (r) => r.key === manager.key && r.coverage.startsWith('Complete') && r.weeks >= 4,
    );
    const covered = observed.filter((r) => r.pickups !== null && r.drops !== null);
    const weeks = covered.reduce((sum, r) => sum + r.weeks, 0),
      moves = covered.reduce((sum, r) => sum + r.pickups! + r.drops!, 0);
    if (covered.length >= 2 && moves / weeks >= 2)
      profiles.push({
        label: 'Tinkerer',
        evidence: `${moves} pickups + drops / ${weeks} weeks across ${covered.length} completely covered seasons (${covered.map((r) => r.year).join(', ')}); threshold ≥2/week, minimum 2 seasons with ≥4 weeks each.`,
      });
    if (manager.ratedPickups >= 10 && manager.pickupHits / manager.ratedPickups >= 0.6)
      profiles.push({
        label: 'Waiver Hawk',
        evidence: `${manager.pickupHits}/${manager.ratedPickups} rated pickups with positive lift across ${manager.seasons.join(', ')}; threshold ≥60%, minimum 10 rated pickups. Includes free-agent pickups; waiver subtype unsupported.`,
      });
    const finals = records.flatMap(({ year, data }) =>
      data.teams
        .filter((t) => (t.managerKey || `unidentified:${year}:${t.teamId}`) === manager.key)
        .flatMap((t) => {
          const r = data.results?.find((r) => r.teamId === t.teamId);
          return r?.finish != null ? [{ year, finish: r.finish }] : [];
        }),
    );
    const runner = finals.filter((r) => r.finish === 2);
    if (finals.length >= 3 && runner.length >= 2)
      profiles.push({
        label: 'Eternal Runner-Up',
        evidence: `${runner.length} second-place finishes in ${finals.length} known final placements (${finals.map((r) => r.year).join(', ')}); minimum 3 known seasons and ≥2 runner-up finishes.`,
      });
    if (manager.championshipSeasons >= 3 && manager.championships >= 2)
      profiles.push({
        label: 'Trophy Collector',
        evidence: `${manager.championships} titles / ${manager.championshipSeasons} known championship seasons (${manager.seasons.join(', ')}); minimum 3 known seasons and ≥2 titles.`,
      });
    return { key: manager.key, manager: manager.managerName, seasons: manager.seasons, profiles };
  });
}

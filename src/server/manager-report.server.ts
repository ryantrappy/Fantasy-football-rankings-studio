import '@tanstack/react-start/server-only';
import axios from 'axios';
import {
  draftMisses,
  managerSeasonEvidence,
  type DraftPick,
  type ManagerReport,
} from '../manager-report';
import { logServerError } from './logging.server';
import HttpException from './exceptions/HttpException';
import SleeperProvider from './providers/sleeper.provider';
import { loadInsights } from './insights/load.server';
const leagueId = '1312529175982129152';
const target = '615609771654995968'; // konz4, resolved from this league's public user catalog.
let cached: { expires: number; report: ManagerReport } | undefined;
let pending: Promise<ManagerReport> | undefined;
async function buildReport(): Promise<ManagerReport> {
  const provider = new SleeperProvider();
  const seasons: ManagerReport['seasons'] = [],
    errors: ManagerReport['errors'] = [];
  let id = leagueId,
    attempted = 0;
  const visited = new Set<string>();
  while (id && visited.size < 6 && !visited.has(id)) {
    visited.add(id);
    const meta = await provider.get<{ season: string; previous_league_id?: string }>(id);
    const year = Number(meta.season);
    if (!Number.isInteger(year) || year < 2000 || year > 2100)
      throw new HttpException(502, 'The league season catalog is unavailable.');
    attempted++;
    try {
      const data = await loadInsights(
        { leagueId: id, leagueType: 0, leagueName: 'konz4 report', seasonId: year },
        year,
      );
      const team = data.teams.find((t) =>
        t.managerKey?.slice('sleeper:'.length).split(',').includes(target),
      );
      if (!team) {
        errors.push({ year, message: 'konz4 did not have an identifiable team in this season.' });
      } else {
        const season: ManagerReport['seasons'][number] = {
          ...managerSeasonEvidence(data, team.teamId, year),
          leagueId: id,
          draftMisses: [],
        };
        if (data.completedWeek >= 4) {
          try {
            const drafts = await provider.get<{ draft_id: string; status: string }[]>(
              `${id}/drafts`,
            );
            for (const draft of drafts.filter((d) => d.status === 'complete')) {
              const { data: picks } = await axios.get<DraftPick[]>(
                `https://api.sleeper.app/v1/draft/${draft.draft_id}/picks`,
                { timeout: 10000 },
              );
              season.draftMisses.push(...draftMisses(data, team.teamId, picks));
            }
            season.draftMisses.sort((a, b) => b.gap - a.gap);
            if (!drafts.some((d) => d.status === 'complete'))
              season.draftNote = 'No completed draft was available.';
          } catch (error) {
            logServerError('managerReport.drafts', error, 502);
            season.draftNote = 'Draft comparisons could not be loaded.';
          }
        } else
          season.draftNote =
            'Draft comparisons need at least four completed, commonly observed weeks.';
        seasons.push(season);
      }
    } catch (error) {
      logServerError('managerReport.season', error, 502);
      errors.push({ year, message: 'This season could not be loaded from Sleeper.' });
    }
    id = meta.previous_league_id || '';
  }
  if (!seasons.length)
    throw new HttpException(502, 'No manager seasons could be loaded. Please try again.');
  return { generatedAt: new Date().toISOString(), seasons, errors, attempted };
}
export async function getManagerReport() {
  if (cached && cached.expires > Date.now()) return cached.report;
  if (pending) return pending;
  pending = buildReport().then((report) => {
    cached = {
      report,
      expires:
        Date.now() +
        (report.errors.length ||
        report.seasons.some((s) => s.draftNote === 'Draft comparisons could not be loaded.')
          ? 60000
          : 900000),
    };
    return report;
  });
  try {
    return await pending;
  } finally {
    pending = undefined;
  }
}

import type { PublicInsightsApi } from './public-insights';
import type { ReportSnapshot } from '../report-snapshot';

export function snapshotInsightsApi(snapshot: ReportSnapshot): PublicInsightsApi {
  const checkLeague = (id: string) => {
    if (id !== snapshot.league.leagueId)
      throw new Error('This league is not in the saved snapshot.');
  };
  return {
    listLeagues: async () => [snapshot.league],
    getLeague: async (id) => {
      checkLeague(id);
      return snapshot.league;
    },
    getLeagueSeasons: async (id) => {
      checkLeague(id);
      return {
        years: snapshot.records.map((r) => r.year).sort((a, b) => b - a),
        activeSeason: snapshot.activeSeason,
        activeManagerKeys: snapshot.activeManagerKeys,
      };
    },
    getInsights: async (id, year) => {
      checkLeague(id);
      const record = snapshot.records.find((r) => r.year === year);
      if (!record) throw new Error('This season is not in the saved snapshot.');
      return { ...record.data, playoffSettings: record.data.playoffSettings };
    },
    dispose: () => {},
  };
}

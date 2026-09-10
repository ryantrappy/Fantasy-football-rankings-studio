import '@tanstack/react-start/server-only';
import { connectDatabase } from './database.server';
import LeaguesService from './services/leagues.service';
import { leagueIdSchema, seasonSchema } from './validation';
import { loadInsights } from './insights/load.server';
import { discoverSeasons } from './insights/seasons.server';

const leagues = new LeaguesService();
async function findLeague(leagueId: string) {
  await connectDatabase();
  return leagues.getPublicLeagueById(leagueId);
}
// A specific registered league is required. No public directory or write operations.
export const publicInsights = {
  getLeague: async (input: unknown) => findLeague(leagueIdSchema.parse(input).leagueId),
  getLeagueSeasons: async (input: unknown) =>
    discoverSeasons(await findLeague(leagueIdSchema.parse(input).leagueId), 'public'),
  getInsights: async (input: unknown) => {
    const { leagueId, year } = seasonSchema.parse(input);
    return loadInsights(await findLeague(leagueId), year, 'public');
  },
};

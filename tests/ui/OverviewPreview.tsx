import { WeeklyOverviewPage } from '../../src/components/WeeklyOverviewPage';
import { ApiContext } from '../../src/auth/session';
import { playoffData } from './fixture';
const api = {
  listLeagues: async () =>
    ['1', '2'].map((leagueId) => ({
      leagueId,
      leagueName: `League ${leagueId}`,
      leagueType: 0,
      seasonId: 2026,
    })),
  getLiveMatchups: async () => [],
  getTeams: async () => [],
  getInsights: async () => playoffData,
  managedTeam: {
    get: async () => ({
      teams: [{ teamId: '1', teamName: 'My team', managerName: 'Owner' }],
      teamId: '1',
      needsReselection: false,
    }),
  },
};
export function OverviewPreview() {
  return (
    <ApiContext value={api as never}>
      <WeeklyOverviewPage />
    </ApiContext>
  );
}

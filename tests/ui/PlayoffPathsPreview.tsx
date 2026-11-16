import { useState } from 'react';
import { ApiContext } from '../../src/auth/session';
import { InsightsAccess } from '../../src/auth/InsightsAccess';
import type { PublicInsightsApi } from '../../src/api/public-insights';
import { PlayoffPathsPage } from '../../src/components/PlayoffPaths';
import { analyticsData } from './AnalyticsPreview';

const league = {
  leagueId: 'fixture',
  leagueName: 'Analytics test league',
  leagueType: 0,
  seasonId: 2026,
};
// The shared analytics fixture has no forecastSchedule (its forecast uses a
// neutral shuffled schedule); the paths simulator needs real fixtures, so use
// the regular-season schedule it was built from.
const pathsData = {
  ...analyticsData,
  forecastSchedule: analyticsData.regularSeasonSchedule?.fixtures ?? [],
};
const api = {
  listLeagues: async () => [league],
  getLeague: async () => league,
  getLeagueSeasons: async () => ({
    years: [2026, 2025, 2024],
    activeSeason: 2026,
    activeManagerKeys: ['1', '2', '3'],
  }),
  getInsights: async () => pathsData,
  managedTeam: { get: async () => ({ teamId: '1', needsReselection: false }) },
  dispose: () => {},
};

export function PlayoffPathsPreview() {
  const [search, setSearch] = useState({ leagueId: 'fixture', year: 2026 });
  return (
    <ApiContext value={api as never}>
      <InsightsAccess publicApi={api as unknown as PublicInsightsApi}>
        <PlayoffPathsPage
          search={search}
          navigate={async ({ search: next }) => {
            setSearch(next);
          }}
          shared={false}
        />
      </InsightsAccess>
    </ApiContext>
  );
}

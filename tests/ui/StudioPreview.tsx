import { useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { AppShell } from '../../src/components/AppShell';
import { WeeklyOverviewPage } from '../../src/components/WeeklyOverviewPage';
import { RankingEditor } from '../../src/components/RankingEditor';
import { InsightsPage } from '../../src/components/InsightsPage';
import { HistoryPage } from '../../src/components/HistoryPage';
import { ProfilePage } from '../../src/components/ProfilePage';
import { ManageLeagues } from '../../src/components/ManageLeagues';
import { CreateLeague } from '../../src/components/CreateLeague';
import { EspnCredentialForm } from '../../src/components/EspnSetup';
import { ApiContext, SessionContext } from '../../src/auth/session';
import { InsightsAccess } from '../../src/auth/InsightsAccess';
import type { PublicInsightsApi } from '../../src/api/public-insights';
import type { SeasonInsights } from '../../src/insights';
import { league, ranking, playoffData, api as editorApi } from './fixture';

const data: SeasonInsights = {
  ...playoffData,
  generatedAt: '2026-10-04T00:00:00Z',
  teams: playoffData.teams.map((team, index) => ({
    ...team,
    managerKey: team.teamId,
    weeks: 4,
    total: 420 + index * 15,
    average: 105 + index * 4,
    best: 135,
    projectedWeeks: 0,
    projectionDelta: null,
    beatProjection: 0,
    aboveMedian: 2,
    bestLineupPoints: 0,
    lineupWeeks: 0,
    correctStarts: 0,
    lineupSlots: 0,
    tradeCount: 0,
    receivedPoints: 0,
    sentPoints: 0,
    netTradePoints: null,
    tradeStarts: 0,
  })),
};
const profile = {
  userId: 'demo-owner',
  name: 'Demo Manager',
  nickname: 'Sunday commissioner',
  email: 'manager@example.test',
  emailVerified: true,
};
const accountApi = {
  getProfile: async () => profile,
  updateProfile: async (value: { name: string; nickname: string }) => ({ ...profile, ...value }),
  getAiCredentialStatus: async () => ({ codexConfigured: false, claudeConfigured: false }),
  saveAiCredential: async () => ({ codexConfigured: false, claudeConfigured: false }),
  removeAiCredential: async () => ({ codexConfigured: false, claudeConfigured: false }),
};
const appApi = {
  ...editorApi,
  listLeagues: async () => [league],
  getInsights: async () => data,
  getLeague: async () => league,
  getLeagueSeasons: async () => ({
    years: [2026, 2025, 2024],
    activeSeason: 2026,
    activeManagerKeys: data.teams.map((team) => team.teamId),
  }),
  getLiveMatchups: async () => [
    {
      leagueId: league.leagueId,
      leagueName: league.leagueName,
      provider: 'Sleeper',
      season: 2026,
      week: 5,
      capturedAt: '2026-10-04T00:00:00Z',
      matchups: [
        {
          id: '1',
          home: { teamId: '1', name: 'Fourth & Long', score: 103.24, players: [] },
          away: { teamId: '2', name: 'Sunday Stunners', score: 98.42, players: [] },
        },
      ],
    },
  ],
  managedTeam: {
    get: async () => ({ teamId: '1', needsReselection: false, teams: ranking.teams }),
    save: async (_id: string, _year: number, teamId: string | null) => ({
      teamId,
      needsReselection: false,
      teams: ranking.teams,
    }),
  },
  management: {
    archived: async () => [],
    deleting: async () => [],
    archive: async () => {},
    rename: async (_id: string, leagueName: string) => ({ ...league, leagueName }),
    updateProviderId: async () => league,
    delete: async () => {},
  },
};
const publicApi = { ...appApi, dispose: () => {} } as unknown as PublicInsightsApi;
const credentialsApi = {
  save: async () => ({ configured: true }),
  remove: async () => ({ configured: false }),
  getStatus: async () => ({ configured: false }),
};

export function StudioPreview() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [insightsSearch, setInsightsSearch] = useState({ leagueId: '123', year: 2026 });
  const [historySearch, setHistorySearch] = useState<{ leagueId: string; years?: number[] }>({
    leagueId: '123',
    years: [2025, 2024],
  });
  return (
    <SessionContext value={{ isAuthenticated: true, signOut: () => {} }}>
      <ApiContext value={appApi as never}>
        <InsightsAccess publicApi={publicApi}>
          <AppShell>
            {path === '/overview' ? (
              <WeeklyOverviewPage />
            ) : path === '/profile' ? (
              <ProfilePage api={accountApi} />
            ) : path === '/leagues/manage' ? (
              <ManageLeagues api={appApi as never} />
            ) : path === '/leagues/new' ? (
              <CreateLeague api={appApi as never} onCreated={() => {}} onCancel={() => {}} />
            ) : path === '/espn' ? (
              <EspnCredentialForm
                api={credentialsApi}
                status={{ configured: false }}
                onSaved={() => {}}
              />
            ) : path === '/insights' || path === '/playoffs' ? (
              <InsightsPage
                playoff={path === '/playoffs'}
                search={insightsSearch}
                navigate={async ({ search }) => setInsightsSearch(search)}
              />
            ) : path === '/history' ? (
              <HistoryPage
                search={historySearch}
                navigate={async ({ search }) => setHistorySearch(search)}
              />
            ) : (
              <RankingEditor api={editorApi} league={league} year={2026} week={2} />
            )}
          </AppShell>
        </InsightsAccess>
      </ApiContext>
    </SessionContext>
  );
}

import { HistoryAnalytics } from '../../src/components/history/HistoryAnalytics';
import { calculateInsights } from '../../src/server/insights/calculate';
import { HistoryPage } from '../../src/components/HistoryPage';
import { InsightsAccess } from '../../src/auth/InsightsAccess';
import { ApiContext } from '../../src/auth/session';
import type { LeagueApi } from '../../src/types';
import { useState } from 'react';
import { league } from './fixture';

const teams = ['Alex', 'Blair', 'Casey', 'Devon'].map((managerName, index) => ({
  teamId: String(index + 1),
  managerKey: `manager-${index}`,
  managerName,
  teamName: `${managerName}'s team`,
}));
const records = [2024, 2025].map((year) => ({
  year,
  data: calculateInsights({
    completedWeek: 4,
    reportingStartWeek: 1,
    playoffSettings: { regularSeasonEnd: 4, playoffTeams: 2 },
    teams,
    results: teams.map((team, index) => ({
      teamId: team.teamId,
      playoff: index < 2,
      finish: index + 1,
      champion: index === 0,
      lastPlace: index === 3,
    })),
    scores: Array.from({ length: 4 }, (_, index) => index + 1).flatMap((week) =>
      teams.map((team, index) => ({
        teamId: team.teamId,
        week,
        actual: 110 - index * 8 + week * 2,
        projected: null,
        opponentTeamId: teams[index ^ 1].teamId,
        lineupAvailable: true,
        starters: [{ playerId: `player-${index}`, points: 25 + week }],
        players: [
          { playerId: `player-${index}`, points: 25 + week },
          { playerId: `bench-${index}`, points: 35 + week },
        ],
        bestLineup: { points: 120 - index * 8 + week * 2, correctStarts: 0, slots: 1 },
      })),
    ),
    moves: [
      {
        id: 'pickup',
        week: 1,
        timestamp: Date.UTC(year, 8, 8),
        type: 'pickup',
        playerId: 'player-0',
        from: null,
        to: '1',
      },
    ],
    moveCoverage: {
      weeks: [1, 2, 3, 4],
      types: ['pickup', 'drop', 'trade'],
      complete: false,
      note: 'Preview sample',
    },
    draftPicks: teams.map((team, index) => ({
      teamId: team.teamId,
      playerId: `player-${index}`,
      overallPick: index + 1,
    })),
    draftFormat: 'snake',
    draftCoverage: 'Preview sample',
    matchupArchive: [
      {
        week: 1,
        teamId: '1',
        opponentTeamId: '2',
        source: 'Demonstration archive',
        preMondayAt: `${year}-09-08T23:00:00Z`,
        snapshots: [
          { capturedAt: `${year}-09-08T23:00:00Z`, probability: 0.05, contributors: [] },
          {
            capturedAt: `${year}-09-09T23:00:00Z`,
            probability: 1,
            contributors: [{ playerId: 'player-0', points: 26 }],
          },
        ],
      },
    ],
    playerNames: Object.fromEntries(
      teams.map((_, index) => [`player-${index}`, `Player ${index + 1}`]),
    ),
    notes: ['Demonstration data'],
    draftPickTrades: 0,
  }),
}));

export function HistoryPreview() {
  const owner = new URLSearchParams(window.location.search).get('owner') === 'true';
  return (
    <ApiContext.Provider value={owner ? ownerApi : null}>
      <HistoryAnalytics
        records={records}
        years={[2025, 2024, 2023]}
        leagueId="preview"
        shared={!owner}
      />
    </ApiContext.Provider>
  );
}

// Exercise production consent, snapshot and revocation controls against isolated fixture storage.
const ownerApi = {
  createReportSnapshot: async (
    input: Parameters<NonNullable<LeagueApi['createReportSnapshot']>>[0],
  ) => {
    sessionStorage.setItem('history-preview-snapshot', JSON.stringify(input));
    return {
      publicId: `${input.wrapped?.scope}-${input.activeSeason}`,
      expiresAt: '2026-10-24T00:00:00Z',
    };
  },
  reportSharing: {
    get: async () => sessionStorage.getItem('history-preview-sharing') !== 'disabled',
    set: async (_id: string, enabled: boolean) => {
      sessionStorage.setItem('history-preview-sharing', enabled ? 'enabled' : 'disabled');
      return enabled;
    },
  },
} as LeagueApi;

const historyApi = {
  getLeagueSeasons: async () => ({
    years: [2025, 2024],
    activeManagerKeys: teams.map((team) => team.managerKey),
    activeSeason: 2025,
  }),
  getInsights: async (_leagueId: string, year: number) =>
    records.find((record) => record.year === year)!.data,
  dispose: () => {},
};
export function HistoryPagePreview() {
  const [search, setSearch] = useState<{ leagueId: string; years?: number[] }>({
    leagueId: league.leagueId,
    years: [2025, 2024],
  });
  return (
    <InsightsAccess publicApi={historyApi as never}>
      <HistoryPage
        search={search}
        navigate={async ({ search: next }) => {
          setSearch(next);
        }}
        shared
        initialLeague={league}
      />
    </InsightsAccess>
  );
}

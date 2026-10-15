import { useMemo, useRef, useState } from 'react';
import { Button, Flex } from '@chakra-ui/react';
import { ReportExportScope } from '../../src/components/DataTable';
import { PlayoffForecast } from '../../src/components/PlayoffForecast';
import { PlayoffCalibration } from '../../src/components/PlayoffCalibration';
import { InsightsPage } from '../../src/components/InsightsPage';
import { ApiContext } from '../../src/auth/session';
import { InsightsAccess } from '../../src/auth/InsightsAccess';
import type { PublicInsightsApi } from '../../src/api/public-insights';
import { calculateInsights } from '../../src/server/insights/calculate';
import { strengthData } from './SeasonStrengthPreview';
import { calibrationApi } from './CalibrationPreview';

// Isolated browser-test evidence; no production provider or fixture replacement.
export const analyticsData = calculateInsights({
  ...strengthData,
  teams: strengthData.teams.map((team) => ({ ...team, managerKey: team.teamId })),
  scores: strengthData.scores.map((score) => ({
    ...score,
    opponentTeamId: String(((Number(score.teamId) - 1) ^ 1) + 1),
    projected: score.week === 4 ? null : score.actual - 5,
    bestLineup:
      score.week === 4 ? undefined : { points: score.actual + 12, correctStarts: 5, slots: 6 },
    players: score.starters.map((player) => ({ playerId: player.playerId, points: player.points })),
  })),
  moves: [
    { id: 'trade', week: 1, timestamp: 1, type: 'trade', playerId: '1-RB', from: '2', to: '1' },
    { id: 'trade', week: 1, timestamp: 1, type: 'trade', playerId: '2-RB', from: '1', to: '2' },
    { id: 'pickup', week: 1, timestamp: 2, type: 'pickup', playerId: '1-WR', from: null, to: '1' },
  ],
  playerNames: { '1-RB': 'Breece Hall', '2-RB': 'James Cook', '1-WR': 'Jayden Reed' },
  playerPositions: { '1-RB': 'RB', '2-RB': 'RB', '1-WR': 'WR' },
  notes: ['Provider fixture coverage: week 4 historical best lineups are unavailable.'],
  draftPickTrades: 0,
});
const sixTeamForecastData = {
  ...analyticsData,
  teams: [
    ...analyticsData.teams,
    ...analyticsData.teams.map((team) => ({
      ...team,
      teamId: String(Number(team.teamId) + 4),
      teamName: `${team.teamName} II`,
    })),
  ],
  scores: [
    ...analyticsData.scores,
    ...analyticsData.scores.map((score) => ({
      ...score,
      teamId: String(Number(score.teamId) + 4),
      opponentTeamId: String(Number(score.opponentTeamId) + 4),
      actual: score.actual - 9,
    })),
  ],
  playoffSettings: {
    regularSeasonEnd: 10,
    playoffTeams: 6,
    rules: {
      provider: 'Sleeper' as const,
      season: 2026,
      tiebreakers: ['head-to-head', 'points-for'] as ('head-to-head' | 'points-for')[],
      divisionWinnersFirst: false,
      divisionByTeam: {},
      roundWeeks: [[11], [12, 13], [14]],
      reseed: true,
    },
  },
};
const league = {
  leagueId: 'fixture',
  leagueName: 'Analytics test league',
  leagueType: 0,
  seasonId: 2026,
};
const api = {
  listLeagues: async () => [league],
  getLeague: async () => league,
  getLeagueSeasons: async () => ({
    years: [2026, 2025, 2024],
    activeSeason: 2026,
    activeManagerKeys: ['1', '2', '3'],
  }),
  getInsights: async (_id: string, year: number) =>
    year === 2026 ? analyticsData : calibrationApi.getInsights(_id, year),
  managedTeam: { get: async () => ({ teamId: '1', needsReselection: false }) },
  dispose: () => {},
};

export function AnalyticsPreview() {
  const [playoff, setPlayoff] = useState(false);
  const [delayHistory, setDelayHistory] = useState(false);
  const waitingHistory = useRef<(() => void)[]>([]);
  const previewCalibrationApi = useMemo(
    () => ({
      ...calibrationApi,
      getInsights: async (id: string, year: number) => {
        if (delayHistory)
          await new Promise<void>((resolve) => {
            waitingHistory.current.push(resolve);
          });
        return calibrationApi.getInsights(id, year);
      },
    }),
    [delayHistory],
  );
  const [search, setSearch] = useState({ leagueId: 'fixture', year: 2026 });
  return (
    <ApiContext value={api as never}>
      <InsightsAccess publicApi={api as unknown as PublicInsightsApi}>
        <Flex gap={2} mb={4} flexWrap="wrap">
          <Button onClick={() => setPlayoff(false)} aria-pressed={!playoff}>
            Open season preview
          </Button>
          <Button onClick={() => setPlayoff(true)} aria-pressed={playoff}>
            Open playoff preview
          </Button>
        </Flex>
        {playoff && (
          <Flex gap={3} mb={3} flexWrap="wrap">
            <label>
              <input
                type="checkbox"
                checked={delayHistory}
                onChange={(event) => setDelayHistory(event.target.checked)}
              />{' '}
              Delay calibration history for cancellation check
            </label>
            <Button
              size="sm"
              onClick={() => {
                waitingHistory.current.splice(0).forEach((release) => release());
              }}
            >
              Release delayed history
            </Button>
          </Flex>
        )}
        {playoff ? (
          <ReportExportScope
            value={{
              context: { League: 'Analytics test league', Season: 2026 },
              filenameContext: 'fixture-2026',
            }}
          >
            <PlayoffForecast
              data={sixTeamForecastData}
              advanced={(active) => (
                <PlayoffCalibration
                  api={previewCalibrationApi}
                  leagueId="fixture"
                  year={2026}
                  active={active}
                />
              )}
            />
          </ReportExportScope>
        ) : (
          <InsightsPage search={search} navigate={async ({ search: next }) => setSearch(next)} />
        )}
      </InsightsAccess>
    </ApiContext>
  );
}

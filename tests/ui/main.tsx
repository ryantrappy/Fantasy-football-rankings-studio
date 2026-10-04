import { createRoot } from 'react-dom/client';
import { Container } from '@chakra-ui/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { Provider } from '../../src/components/ui/provider';
import { RankingEditor } from '../../src/components/RankingEditor';
import { CreateLeague } from '../../src/components/CreateLeague';
import { RankingPreview } from '../../src/components/RankingPreview';
import { ScoreTrend } from '../../src/components/ScoreTrend';
import { PlayoffForecast } from '../../src/components/PlayoffForecast';
import { LeagueSummary } from '../../src/components/LeagueSummary';
import { api, league, ranking, history, playoffData } from './fixture';
import '../../src/index.css';
import { PalettePreview } from './PalettePreview';
import { LiveWorkspace } from './LiveWorkspace';
import { OverviewPreview } from './OverviewPreview';
import { CalibrationPreview } from './CalibrationPreview';
const mode = new URLSearchParams(location.search).get('mode');
function PreviewApp() {
  if (mode === 'live')
    return (
      <Provider>
        <LiveWorkspace />
      </Provider>
    );
  return (
    <Provider>
      {mode === 'editor-header' && (
        <header className="workspace-header" style={{ height: 128 }}>
          Studio header
        </header>
      )}
      <Container maxW="1280px" p={4}>
        {mode === 'overview' ? (
          <OverviewPreview />
        ) : mode === 'palette' ? (
          <PalettePreview />
        ) : mode === 'create' ? (
          <CreateLeague
            api={api}
            onCreated={() => {
              document.title = 'League created';
            }}
            onCancel={() => {}}
          />
        ) : mode === 'export' ? (
          <div className="export-canvas">
            <RankingPreview league={league} ranking={ranking} history={history} />
          </div>
        ) : mode === 'chart' ? (
          <ScoreTrend
            teamName="Fourth & Long"
            scores={[1, 2, 3].map((week) => ({
              teamId: '1',
              week,
              actual: 95 + week * 10,
              projected: 105,
              starters: [],
            }))}
          />
        ) : mode === 'calibration' ? (
          <CalibrationPreview />
        ) : mode === 'playoffs' ? (
          <PlayoffForecast data={playoffData} />
        ) : mode === 'season-summary' ? (
          <LeagueSummary
            records={[
              {
                year: 2026,
                data: {
                  ...playoffData,
                  teams: playoffData.teams.map((team) => ({
                    ...team,
                    managerKey: team.teamId,
                    weeks: 4,
                    total: 400,
                    average: 100,
                    best: 120,
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
                },
              },
            ]}
          />
        ) : (
          <RankingEditor api={api} league={league} year={2026} week={2} />
        )}
      </Container>
    </Provider>
  );
}

const rootRoute = createRootRoute();
const previewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: PreviewApp,
});
const router = createRouter({
  routeTree: rootRoute.addChildren([
    previewRoute,
    createRoute({ getParentRoute: () => rootRoute, path: '/live', component: PreviewApp }),
  ]),
  history: createMemoryHistory({ initialEntries: [mode === 'live' ? '/live' : '/'] }),
});

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);

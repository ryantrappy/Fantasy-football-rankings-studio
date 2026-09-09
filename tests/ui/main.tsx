import { createRoot } from 'react-dom/client';
import { Container } from '@chakra-ui/react';
import { Provider } from '../../src/components/ui/provider';
import { RankingEditor } from '../../src/components/RankingEditor';
import { CreateLeague } from '../../src/components/CreateLeague';
import { RankingPreview } from '../../src/components/RankingPreview';
import { ScoreTrend } from '../../src/components/ScoreTrend';
import { api, league, ranking, history } from './fixture';
import '../../src/index.css';
import { PalettePreview } from './PalettePreview';
const mode = new URLSearchParams(location.search).get('mode');
createRoot(document.getElementById('root')!).render(
  <Provider>
    <Container maxW="1280px" p={4}>
      {mode === 'palette' ? (
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
          scores={[1, 2, 3].map((week) => ({
            teamId: '1',
            week,
            actual: 95 + week * 10,
            projected: 105,
            starters: [],
          }))}
        />
      ) : (
        <RankingEditor api={api} league={league} year={2026} week={2} />
      )}
    </Container>
  </Provider>,
);

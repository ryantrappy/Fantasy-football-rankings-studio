import { createRoot } from 'react-dom/client';
import { Provider } from '../../src/components/ui/provider';
import { ManagedTeamPicker } from '../../src/components/ManagedTeamPicker';
import '../../src/index.css';
const api = {
  get: async (_leagueId: string, year: number) =>
    (await fetch(`/tests/managed-team-api?year=${year}`)).json(),
  set: async (_leagueId: string, year: number, teamId: string | null) =>
    (
      await fetch('/tests/managed-team-api', {
        method: 'POST',
        body: JSON.stringify({ year, teamId }),
      })
    ).json(),
};
createRoot(document.getElementById('root')!).render(
  <Provider>
    <main style={{ maxWidth: 700, padding: 20, margin: 'auto' }}>
      <h1>Manage your team</h1>
      <ManagedTeamPicker
        api={api}
        subject="browser-test-owner"
        leagueId="test"
        initialYear={2025}
      />
    </main>
  </Provider>,
);

import { AppShell } from '../../src/components/AppShell';
import { LiveMatchupsPage } from '../../src/components/LiveMatchupsPage';
import { ApiContext, SessionContext } from '../../src/auth/session';
import type { LiveLeague } from '../../src/live-matchups';
import type { createApi } from '../../src/api/client';

const leagues: LiveLeague[] = ['Sunday League', 'Monday League'].map((name, leagueIndex) => ({
  leagueId: String(leagueIndex + 1),
  leagueName: name,
  provider: 'Sleeper',
  season: 2026,
  week: 4,
  matchups: Array.from({ length: 3 }, (_, index) => ({
    id: String(index + 1),
    home: team(`Home ${leagueIndex * 3 + index + 1}`),
    away: team(`Away ${leagueIndex * 3 + index + 1}`),
  })),
}));
function team(name: string) {
  return {
    teamId: name,
    name,
    score: 103.24,
    players: Array.from({ length: 16 }, (_, index) => ({
      id: String(index),
      name: `Player ${index + 1}`,
      position: index === 0 ? 'QB' : index < 5 ? 'RB' : 'WR',
      points: 12.34,
      starter: index < 9,
    })),
  };
}
const api = { getLiveMatchups: async () => leagues } as unknown as ReturnType<typeof createApi>;
export function LiveWorkspace() {
  return (
    <SessionContext.Provider
      value={{
        isAuthenticated: true,
        signOut: () => {
          document.title = 'Signed out';
        },
      }}
    >
      <ApiContext.Provider value={api}>
        <AppShell>
          <LiveMatchupsPage />
        </AppShell>
      </ApiContext.Provider>
    </SessionContext.Provider>
  );
}

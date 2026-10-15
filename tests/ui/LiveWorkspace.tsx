import { AppShell } from '../../src/components/AppShell';
import { LiveMatchupsPage } from '../../src/components/LiveMatchupsPage';
import { ApiContext, SessionContext } from '../../src/auth/session';
import type { LiveLeague, NflSchedule } from '../../src/live-matchups';
import type { createApi } from '../../src/api/client';

const scheduled = new URLSearchParams(location.search).has('schedule');
const managed = new URLSearchParams(location.search).has('managed');
const leagues: LiveLeague[] = (
  managed
    ? ['Sunday League', 'Monday League', 'Tuesday League', 'Wednesday League', 'Thursday League']
    : ['Sunday League', 'Monday League']
).map((name, leagueIndex) => ({
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
    players: Array.from(
      { length: new URLSearchParams(location.search).has('long') ? 30 : 18 },
      (_, index) => ({
        id: String(index),
        name:
          new URLSearchParams(location.search).has('names') && index === 0
            ? 'A player with a long complete provider name'
            : `Player ${index + 1}`,
        availability:
          new URLSearchParams(location.search).has('names') && index === 0
            ? 'QUESTIONABLE'
            : undefined,
        position: index === 0 ? 'QB' : index < 5 ? 'RB' : 'WR',
        points: 12.34,
        projectedPoints: 16.5,
        remainingFraction: index % 3 === 0 ? 0 : index % 3 === 1 ? 0.4 : 1,
        bye: index === 17,
        nflSchedule: scheduled
          ? ({
              status:
                index === 17
                  ? 'bye'
                  : index === 1
                    ? 'postponed'
                    : index === 2
                      ? 'rescheduled'
                      : index % 3 === 0
                        ? 'final'
                        : index % 3 === 1
                          ? 'in-progress'
                          : 'scheduled',
              kickoffAt: index === 1 || index === 5 ? undefined : '2026-11-02T01:20:00.000Z',
              source: 'ESPN NFL scoreboard',
              capturedAt: '2026-10-15T20:00:00.000Z',
            } as NflSchedule)
          : undefined,
        starter: index < 9,
      }),
    ),
  };
}
const api = {
  getLiveMatchups: async () => leagues,
  ...(managed
    ? {
        managedTeam: {
          get: async (leagueId: string) => {
            const index = leagues.findIndex((league) => league.leagueId === leagueId);
            const matchup = leagues[index].matchups[1];
            return {
              teamId: index % 2 ? matchup.away!.teamId : matchup.home.teamId,
              needsReselection: false,
              teams: [],
            };
          },
        },
      }
    : {}),
} as unknown as ReturnType<typeof createApi>;
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
          <LiveMatchupsPage
            search={{
              leagueId: new URLSearchParams(location.search).get('leagueId') ?? undefined,
              year: Number(new URLSearchParams(location.search).get('year')) || undefined,
            }}
          />
        </AppShell>
      </ApiContext.Provider>
    </SessionContext.Provider>
  );
}

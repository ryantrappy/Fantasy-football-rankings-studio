import '@tanstack/react-start/server-only';
import type { League } from '../interfaces/league.interface';
import SleeperProvider from '../providers/sleeper.provider';
import EspnProvider, { type EspnAccess } from '../providers/espn.provider';

function isPublicAccessDenied(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const anyError = error as {
    status?: number;
    response?: { status?: number };
    message?: string;
  };
  return (
    anyError.status === 401 ||
    anyError.response?.status === 401 ||
    /401|access denied|unauthorized/i.test(anyError.message || '')
  );
}

async function seasonYears(league: League, access: EspnAccess): Promise<number[]> {
  if (league.leagueType === 1) {
    const data = await new EspnProvider(access).get<{
      id: number;
      seasonId: number;
      status?: { previousSeasons?: number[] };
    }>(league.leagueId, league.seasonId, ['mSettings']);
    return [...new Set([data.seasonId, ...(data.status?.previousSeasons || [])])]
      .filter((y) => Number.isInteger(y) && y >= 2000 && y <= 2100)
      .sort((a, b) => b - a);
  }
  const provider = new SleeperProvider(),
    seen = new Set<string>(),
    years = new Set<number>();
  let id = league.leagueId;
  while (id && !seen.has(id) && seen.size < 30) {
    seen.add(id);
    const data = await provider.get<{ season: string; previous_league_id?: string }>(id);
    if (!data) break;
    const year = Number(data.season);
    if (Number.isInteger(year) && year >= 2000 && year <= 2100) years.add(year);
    id = data.previous_league_id || '';
  }
  return [...years].sort((a, b) => b - a);
}

export async function discoverSeasons(league: League, access: EspnAccess = 'environment') {
  try {
    const years = await seasonYears(league, access);
    const activeSeason = years[0] ?? league.seasonId;
    const provider = league.leagueType === 0 ? new SleeperProvider() : new EspnProvider(access);
    const teams = await provider.getTeams(league, activeSeason, 1);
    return {
      years,
      activeSeason,
      activeManagerKeys: teams.flatMap((t) => (t.managerKey ? [t.managerKey] : [])),
    };
  } catch (error) {
    if (access === 'public' && isPublicAccessDenied(error)) {
      const fallbackSeason = league.seasonId;
      return {
        years: [fallbackSeason],
        activeSeason: fallbackSeason,
        activeManagerKeys: [],
      };
    }
    throw error;
  }
}

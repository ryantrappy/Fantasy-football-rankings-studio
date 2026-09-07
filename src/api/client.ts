import type { League, LeagueApi, Team, WeeklyRanking } from '../types';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export function createApi(getToken: () => Promise<string>): LeagueApi {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const token = await getToken();
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(result?.message || `Request failed (${response.status}). Please try again.`, response.status);
    }
    return (result?.data ?? result) as T;
  }
  return {
    listLeagues: () => request<League[]>('/leagues'),
    createLeague: (league) => request<League>('/leagues', 'POST', league),
    getTeams: (id, year, week) => request<Team[]>(`/leagues/${encodeURIComponent(id)}/seasons/${year}/weeks/${week}/teams`),
    getRankings: (id) => request<WeeklyRanking[]>(`/rankings/leagues/${encodeURIComponent(id)}`),
    saveRanking: (ranking) => request<WeeklyRanking>(ranking._id ? `/rankings/${encodeURIComponent(ranking._id)}` : '/rankings', ranking._id ? 'PUT' : 'POST', ranking),
  };
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

import '@tanstack/react-start/server-only';
import axios from 'axios';
import { scoreSleeperProjection } from '../../combined-projections';
import { providerRequest } from '../providers/request-limit';

// This endpoint retains forecasts by season/week, but does not establish that
// today's response is identical to an independently archived pre-kickoff value.
export async function historicalSleeperProjections(
  year: number,
  week: number,
  scoring: Record<string, number>,
) {
  const { data } = await providerRequest(() =>
    axios.get<
      {
        player_id?: string;
        season?: string | number;
        week?: number;
        stats?: Record<string, number>;
      }[]
    >(`https://api.sleeper.app/projections/nfl/${year}/${week}`, {
      params: {
        season_type: 'regular',
        'position[]': ['FLEX', 'K', 'QB', 'RB', 'TE', 'WR', 'DEF', 'DL', 'LB', 'DB'],
      },
      timeout: 10000,
    }),
  );
  if (!Array.isArray(data)) throw new Error('Invalid historical Sleeper projection response');
  const projections = new Map<string, number>();
  for (const row of data) {
    if (
      !row?.player_id ||
      (row.season !== undefined && Number(row.season) !== year) ||
      (row.week !== undefined && row.week !== week)
    )
      continue;
    const points = scoreSleeperProjection(row.stats, scoring);
    if (points !== undefined) projections.set(row.player_id, points);
  }
  return projections;
}

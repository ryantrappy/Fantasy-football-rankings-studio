import axios from 'axios';
import type { InsightsSource } from '../../insights';
import { providerRequest } from '../providers/request-limit';
export async function sleeperDraft(
  leagueId: string,
): Promise<Pick<InsightsSource, 'draftPicks' | 'draftFormat' | 'draftCoverage'>> {
  try {
    const { data: drafts } = await providerRequest(() =>
      axios.get<{ draft_id: string; status: string; type?: string }[]>(
        `https://api.sleeper.app/v1/league/${leagueId}/drafts`,
        { timeout: 10000 },
      ),
    );
    const completed = drafts.filter((d) => d.status === 'complete');
    if (completed.length !== 1)
      return {
        draftCoverage:
          'Unavailable: expected one completed season draft; multiple drafts are not combined.',
        draftFormat: 'unknown',
      };
    const draft = completed[0];
    const { data: picks } = await providerRequest(() =>
      axios.get<{ player_id: string; roster_id: number; pick_no: number; round: number }[]>(
        `https://api.sleeper.app/v1/draft/${draft.draft_id}/picks`,
        { timeout: 10000 },
      ),
    );
    const valid = picks.filter(
      (p) => p.player_id && p.roster_id > 0 && Number.isInteger(p.pick_no) && p.pick_no > 0,
    );
    return {
      draftPicks: valid.map((p) => ({
        playerId: p.player_id,
        teamId: String(p.roster_id),
        overallPick: p.pick_no,
        ...(Number.isInteger(p.round) && p.round > 0 ? { round: p.round } : {}),
      })),
      draftFormat:
        draft.type === 'snake'
          ? 'snake'
          : draft.type === 'linear'
            ? 'linear'
            : draft.type === 'auction'
              ? 'auction'
              : 'unknown',
      draftCoverage: `Sleeper completed draft: ${valid.length}/${picks.length} assigned picks. ADP and private draft queues unavailable.`,
    };
  } catch {
    return {
      draftCoverage:
        'Unavailable: historical draft could not be retrieved. ADP and private queues unsupported.',
      draftFormat: 'unknown',
    };
  }
}

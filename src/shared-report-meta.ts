import type { PublicInsightsApi } from './api/public-insights';
import type { League } from './types';

export interface SharedReportPreview {
  leagueName: string;
  context: string;
}

export interface SharedReportLoaderData {
  league: League | null;
  preview: SharedReportPreview | null;
}

const genericTitle = 'Shared fantasy report | Fantasy Power Rankings';
const genericDescription = 'View a shared fantasy football report.';

export async function loadSharedReportPreview(
  api: PublicInsightsApi,
  leagueId: string,
  context: string,
): Promise<SharedReportLoaderData> {
  if (!leagueId) return { league: null, preview: null };
  try {
    const league = await api.getLeague(leagueId);
    return {
      league,
      preview: {
        leagueName: league.leagueName.trim() || 'Fantasy league',
        context,
      },
    };
  } catch {
    return { league: null, preview: null };
  }
}

export function sharedReportMeta(preview: SharedReportPreview | null | undefined) {
  const title = preview
    ? `${preview.leagueName} ${preview.context} | Fantasy Power Rankings`
    : genericTitle;
  const description = preview
    ? `View ${preview.context.toLowerCase()} for ${preview.leagueName}.`
    : genericDescription;
  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ];
}

export function publishedEditionMeta(
  result:
    | { ok: true; data: { ranking: { year: number; week: number } } }
    | { ok: false; error: unknown }
    | undefined,
) {
  const preview = result?.ok
    ? {
        leagueName: `${result.data.ranking.year} Week ${result.data.ranking.week}`,
        context: 'published power rankings',
      }
    : null;
  return [...sharedReportMeta(preview), { name: 'robots', content: 'noindex, nofollow' }];
}

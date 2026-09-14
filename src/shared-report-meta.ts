import { getPublicLeague } from './functions/public-insights.functions';

export interface SharedReportPreview {
  leagueName: string;
  context: string;
}

const genericTitle = 'Shared fantasy report | Fantasy Power Rankings';
const genericDescription = 'View a shared fantasy football report.';

export async function loadSharedReportPreview(
  leagueId: string,
  context: string,
): Promise<SharedReportPreview | null> {
  if (!leagueId) return null;
  try {
    const result = await getPublicLeague({ data: { leagueId } });
    if (!result.ok) return null;
    return {
      leagueName: result.data.leagueName.trim() || 'Fantasy league',
      context,
    };
  } catch {
    return null;
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

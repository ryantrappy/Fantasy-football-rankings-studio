import { describe, expect, it } from 'vitest';
import { publishedEditionMeta, sharedReportMeta } from './shared-report-meta';

const content = (meta: ReturnType<typeof sharedReportMeta>) => JSON.stringify(meta);

describe('shared report metadata', () => {
  it('identifies the public league and season without copying private fields', () => {
    const meta = content(
      sharedReportMeta({ leagueName: 'Sunday League', context: '2026 season insights' }),
    );
    expect(meta).toContain('Sunday League 2026 season insights');
    expect(meta).toContain('View 2026 season insights for Sunday League.');
    expect(meta).not.toContain('ownerSubject');
    expect(meta).not.toContain('credentials');
  });

  it('uses a generic preview for unavailable shared reports', () => {
    const meta = content(sharedReportMeta(null));
    expect(meta).toContain('Shared fantasy report');
    expect(meta).toContain('View a shared fantasy football report.');
    expect(meta).not.toContain('provider');
    expect(meta).not.toContain('error');
  });

  it('describes only the public coordinates of a published edition', () => {
    const meta = JSON.stringify(
      publishedEditionMeta({
        ok: true,
        data: {
          ranking: {
            year: 2025,
            week: 7,
            rankingsTitle: 'Unpublished secret draft title',
          },
        },
      } as Parameters<typeof publishedEditionMeta>[0] & {
        data: { ranking: { rankingsTitle: string } };
      }),
    );
    expect(meta).toContain('2025 Week 7 published power rankings');
    expect(meta).not.toContain('Unpublished secret draft title');
  });
});

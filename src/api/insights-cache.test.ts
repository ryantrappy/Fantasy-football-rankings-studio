import { createApi } from './client';
import { createPublicInsightsApi } from './public-insights';
import * as privateFunctions from '../functions/rankings.functions';
import * as publicFunctions from '../functions/public-insights.functions';
import type { SeasonInsights } from '../insights';

vi.mock('../functions/rankings.functions', () => ({ getInsights: vi.fn() }));
vi.mock('../functions/public-insights.functions', () => ({ getPublicInsights: vi.fn() }));

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

it.each(['private', 'public'] as const)(
  'reuses %s historical reports after page navigation and refreshes on demand',
  async (scope) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-15T12:00:00Z'));
    const read =
      scope === 'private' ? privateFunctions.getInsights : publicFunctions.getPublicInsights;
    vi.mocked(read).mockResolvedValue({
      ok: true,
      data: { ...({ scores: [] } as unknown as SeasonInsights), playoffSettings: undefined },
    });
    const api =
      scope === 'private' ? createApi(async () => 'token', 'owner') : createPublicInsightsApi();
    try {
      await Promise.all([api.getInsights('123', 2025), api.getInsights('123', 2025)]);
      await vi.advanceTimersByTimeAsync(6 * 60 * 1000);
      await api.getInsights('123', 2025);
      expect(read).toHaveBeenCalledTimes(1);
      await api.getInsights('123', 2025, true);
      expect(read).toHaveBeenCalledTimes(2);
      await api.getInsights('123', 2026);
      await vi.advanceTimersByTimeAsync(6 * 60 * 1000);
      await api.getInsights('123', 2026);
      expect(read).toHaveBeenCalledTimes(4);
    } finally {
      await api.dispose();
    }
  },
);

it('keeps historical report caches separate between owners', async () => {
  vi.mocked(privateFunctions.getInsights).mockResolvedValue({
    ok: true,
    data: { ...({ scores: [] } as unknown as SeasonInsights), playoffSettings: undefined },
  });
  const first = createApi(async () => 'a-token', 'a');
  const second = createApi(async () => 'b-token', 'b');
  try {
    await first.getInsights('123', 2025);
    await second.getInsights('123', 2025);
    expect(privateFunctions.getInsights).toHaveBeenCalledTimes(2);
  } finally {
    await first.dispose();
    await second.dispose();
  }
});

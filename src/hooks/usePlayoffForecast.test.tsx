import { act, renderHook, waitFor } from '@testing-library/react';
import { usePlayoffForecast } from './usePlayoffForecast';
import type { SeasonInsights } from '../insights';
import { requestPlayoffForecast } from '../playoff-timeline';
vi.mock('../playoff-timeline', () => ({
  requestPlayoffForecast: vi.fn(),
  peekPlayoffForecast: () => undefined,
}));

it('keeps pending controls available, cancels replaced/unmounted work and ignores delayed results', async () => {
  const requests: { signal: AbortSignal; resolve: (data: any) => void }[] = [];
  vi.mocked(requestPlayoffForecast).mockImplementation(
    (_data, _settings, _week, signal) =>
      new Promise((resolve) => requests.push({ signal: signal!, resolve })),
  );
  const data = {} as SeasonInsights;
  const settings = { regularSeasonEnd: 14, playoffTeams: 4 };
  const { result, rerender, unmount } = renderHook(
    ({ week }) => usePlayoffForecast(data, settings, week),
    { initialProps: { week: 6 } },
  );
  expect(result.current.pending).toBe(true);
  rerender({ week: 3 });
  expect(requests[0].signal.aborted).toBe(true);
  await act(async () => requests[1].resolve({ throughWeek: 3 }));
  await waitFor(() => expect(result.current.forecast?.throughWeek).toBe(3));
  await act(async () => requests[0].resolve({ throughWeek: 6 }));
  expect(result.current.forecast?.throughWeek).toBe(3);
  rerender({ week: 1 });
  unmount();
  expect(requests[2].signal.aborted).toBe(true);
});

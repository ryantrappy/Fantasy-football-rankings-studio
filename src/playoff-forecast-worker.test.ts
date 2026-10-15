import type { SeasonInsights } from './insights';
import type { ForecastWorkerInput, ForecastWorkerResponse } from './playoff-forecast-worker-client';

const data = {
  completedWeek: 2,
  teams: ['1', '2', '3', '4'].map((teamId) => ({ teamId, teamName: teamId })),
  scores: [1, 2].flatMap((week) =>
    ['1', '2', '3', '4'].map((teamId, i) => ({
      teamId,
      opponentTeamId: String((i ^ 1) + 1),
      week,
      actual: 90 + 10 * i + week,
    })),
  ),
} as SeasonInsights;
const settings = { regularSeasonEnd: 3, playoffTeams: 2 };

class MockWorker {
  static instances: MockWorker[] = [];
  onmessage?: (event: { data: ForecastWorkerResponse }) => void;
  onerror?: () => void;
  onmessageerror?: () => void;
  messages: (ForecastWorkerInput & { id: number })[] = [];
  terminate = vi.fn();
  constructor() {
    MockWorker.instances.push(this);
  }
  postMessage(message: ForecastWorkerInput & { id: number }) {
    this.messages.push(message);
  }
  async complete() {
    const { forecastPlayoffs } = await import('./playoff-forecast');
    const message = this.messages.at(-1)!;
    this.onmessage!({
      data: {
        id: message.id,
        result: forecastPlayoffs(
          message.data,
          message.settings,
          message.cutoff,
          message.simulations,
          message.scoreModel,
        ),
      },
    });
  }
}

beforeEach(() => {
  vi.resetModules();
  MockWorker.instances = [];
  vi.stubGlobal('Worker', MockWorker);
});
afterEach(() => vi.unstubAllGlobals());

it('queues requests on one worker and preserves deterministic forecasts and the completed cache', async () => {
  const { requestPlayoffForecast, peekPlayoffForecast } = await import('./playoff-timeline');
  const { forecastPlayoffs } = await import('./playoff-forecast');
  const first = requestPlayoffForecast(data, settings, 1);
  const second = requestPlayoffForecast(data, settings, 2);
  const worker = MockWorker.instances[0];
  expect(MockWorker.instances).toHaveLength(1);
  expect(worker.messages).toHaveLength(1);
  expect(peekPlayoffForecast(data, settings, 1)).toBeUndefined();
  await worker.complete();
  const result = await first;
  expect(result).toEqual(forecastPlayoffs(data, settings, 1));
  expect(worker.messages).toHaveLength(2);
  await worker.complete();
  expect(await second).toEqual(forecastPlayoffs(data, settings, 2));
  expect(await requestPlayoffForecast(data, settings, 1)).toBe(result);
  expect(worker.messages).toHaveLength(2);
});

it('removes queued cancellations and terminates active work without caching it or cancelling other requests', async () => {
  const { requestPlayoffForecast, peekPlayoffForecast } = await import('./playoff-timeline');
  const activeController = new AbortController();
  const queuedController = new AbortController();
  const active = requestPlayoffForecast(data, settings, 1, activeController.signal);
  const queued = requestPlayoffForecast(data, settings, 2, queuedController.signal);
  const next = requestPlayoffForecast(data, settings, 3);
  const activeRejected = expect(active).rejects.toMatchObject({ name: 'AbortError' });
  const queuedRejected = expect(queued).rejects.toMatchObject({ name: 'AbortError' });
  queuedController.abort();
  expect(MockWorker.instances[0].terminate).not.toHaveBeenCalled();
  activeController.abort();
  await Promise.all([activeRejected, queuedRejected]);
  expect(MockWorker.instances[0].terminate).toHaveBeenCalledTimes(1);
  expect(MockWorker.instances).toHaveLength(2);
  expect(MockWorker.instances[1].messages).toHaveLength(1);
  await MockWorker.instances[1].complete();
  await next;
  expect(peekPlayoffForecast(data, settings, 1)).toBeUndefined();
  expect(peekPlayoffForecast(data, settings, 2)).toBeDefined();
});

it('falls back cooperatively for active and queued work when worker loading fails', async () => {
  const { forecastPlayoffsAsync, forecastPlayoffs } = await import('./playoff-forecast');
  const historical = forecastPlayoffsAsync(data, settings, 1, undefined, 500);
  const standings = forecastPlayoffsAsync(data, settings, 2, undefined, 500, 'equal-strength');
  MockWorker.instances[0].onerror!();
  expect(await historical).toEqual(forecastPlayoffs(data, settings, 1, 500));
  expect(await standings).toEqual(forecastPlayoffs(data, settings, 2, 500, 'equal-strength'));
  await forecastPlayoffsAsync(data, settings, 1, undefined, 100);
  expect(MockWorker.instances).toHaveLength(1);
  expect(MockWorker.instances[0].terminate).toHaveBeenCalledTimes(1);
});

it('uses the deterministic fallback during server rendering without creating a worker', async () => {
  vi.stubGlobal('window', undefined);
  const { forecastPlayoffsAsync, forecastPlayoffs } = await import('./playoff-forecast');
  expect(await forecastPlayoffsAsync(data, settings, 1, undefined, 500)).toEqual(
    forecastPlayoffs(data, settings, 1, 500),
  );
  expect(MockWorker.instances).toHaveLength(0);
});

it('propagates simulation errors and continues serving later requests', async () => {
  const { forecastPlayoffsAsync } = await import('./playoff-forecast');
  const pending = forecastPlayoffsAsync(data, settings, 1);
  const worker = MockWorker.instances[0];
  const rejected = expect(pending).rejects.toMatchObject({
    name: 'RangeError',
    message: 'Simulation failed',
  });
  worker.onmessage!({
    data: {
      id: worker.messages[0].id,
      error: { name: 'RangeError', message: 'Simulation failed' },
    },
  });
  await rejected;
  const next = forecastPlayoffsAsync(data, settings, 2, undefined, 100);
  await worker.complete();
  await next;
  expect(MockWorker.instances).toHaveLength(1);
});

it('executes the worker message handler with the requested cutoff and score model', async () => {
  const { forecastPlayoffs } = await import('./playoff-forecast');
  const scope = {
    onmessage: undefined as
      | undefined
      | ((event: { data: ForecastWorkerInput & { id: number } }) => Promise<void>),
    postMessage: vi.fn(),
  };
  vi.stubGlobal('self', scope);
  await import('./playoff-forecast.worker');
  await scope.onmessage!({
    data: { id: 17, data, settings, cutoff: 1, simulations: 500, scoreModel: 'equal-strength' },
  });
  expect(scope.postMessage).toHaveBeenCalledWith({
    id: 17,
    result: forecastPlayoffs(data, settings, 1, 500, 'equal-strength'),
  });
});

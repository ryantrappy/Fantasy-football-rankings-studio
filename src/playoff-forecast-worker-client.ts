import type { SeasonInsights } from './insights';
import type { PlayoffForecast, PlayoffSettings } from './playoff-forecast';

export interface ForecastWorkerInput {
  data: SeasonInsights;
  settings: PlayoffSettings;
  cutoff: number;
  simulations: number;
  scoreModel: 'historical' | 'equal-strength';
}

export type ForecastWorkerResponse =
  | { id: number; result: PlayoffForecast }
  | { id: number; error: { message: string; name: string } };

interface Job {
  id: number;
  input: ForecastWorkerInput;
  resolve: (result: PlayoffForecast | undefined) => void;
  reject: (error: Error) => void;
  signal?: AbortSignal;
  abort: () => void;
}

// Share one worker across interactive forecasts and calibration cutoffs. Queueing
// bounds CPU/memory use even when several reports request simulations together.
let worker: Worker | undefined;
let unavailable = false;
let nextId = 0;
let active: Job | undefined;
const queue: Job[] = [];

function release(job: Job) {
  job.signal?.removeEventListener('abort', job.abort);
  if (active === job) active = undefined;
}

function fallback() {
  unavailable = true;
  worker?.terminate();
  worker = undefined;
  const jobs = active ? [active, ...queue.splice(0)] : queue.splice(0);
  for (const job of jobs) {
    release(job);
    job.resolve(undefined);
  }
}

function dispatch() {
  if (active || !queue.length) return;
  try {
    if (!worker) {
      worker = new Worker(new URL('./playoff-forecast.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.onmessage = ({ data }: MessageEvent<ForecastWorkerResponse>) => {
        const job = active;
        if (!job || job.id !== data.id) return;
        release(job);
        if ('error' in data) {
          const error = new Error(data.error.message);
          error.name = data.error.name;
          job.reject(error);
        } else job.resolve(data.result);
        dispatch();
      };
      worker.onerror = fallback;
      worker.onmessageerror = fallback;
    }
    active = queue.shift()!;
    worker.postMessage({ id: active.id, ...active.input });
  } catch {
    // CSP, unsupported module workers, or uncloneable provider data should not
    // prevent forecasts: use the cooperative main-thread implementation instead.
    fallback();
  }
}

export function requestForecastInWorker(
  input: ForecastWorkerInput,
  signal?: AbortSignal,
): Promise<PlayoffForecast | undefined> {
  signal?.throwIfAborted();
  if (unavailable || typeof window === 'undefined' || typeof Worker === 'undefined')
    return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const job: Job = {
      id: ++nextId,
      input,
      resolve,
      reject,
      signal,
      abort: () => {
        if (active === job) {
          // Terminating cancels synchronous simulation immediately, then the
          // next queued request gets a fresh worker.
          worker?.terminate();
          worker = undefined;
        } else {
          const index = queue.indexOf(job);
          if (index !== -1) queue.splice(index, 1);
        }
        release(job);
        reject(new DOMException('Forecast canceled', 'AbortError'));
        dispatch();
      },
    };
    signal?.addEventListener('abort', job.abort, { once: true });
    queue.push(job);
    dispatch();
  });
}

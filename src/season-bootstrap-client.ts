import {
  runBootstrapSeasons,
  type BootstrapLeague,
  type BootstrapOptions,
  type BootstrapResult,
} from './season-bootstrap';
import type { BootstrapWorkerReply } from './season-bootstrap.worker';

export async function runSeasonBootstrap(
  league: BootstrapLeague,
  options: BootstrapOptions,
  onProgress: (completed: number) => void,
  signal: AbortSignal,
) {
  signal.throwIfAborted();
  let worker: Worker | undefined;
  try {
    worker = new Worker(new URL('./season-bootstrap.worker.ts', import.meta.url), {
      type: 'module',
    });
  } catch {
    return runBootstrapSeasons(league, options, onProgress, signal);
  }
  const active = worker;
  let abort: (() => void) | undefined;
  let result: BootstrapResult | undefined;
  try {
    result = await new Promise<BootstrapResult | undefined>((resolve, reject) => {
      abort = () => reject(signal.reason);
      signal.addEventListener('abort', abort, { once: true });
      active.onmessage = ({ data }: MessageEvent<BootstrapWorkerReply>) => {
        if (signal.aborted) return;
        if ('progress' in data) onProgress(data.progress);
        else if ('result' in data) resolve(data.result);
        else reject(new Error(data.error));
      };
      active.onerror = () => resolve(undefined);
      active.onmessageerror = () => resolve(undefined);
      active.postMessage({ league, options });
    });
  } finally {
    if (abort) signal.removeEventListener('abort', abort);
    active.terminate();
  }
  signal.throwIfAborted();
  return result ?? runBootstrapSeasons(league, options, onProgress, signal);
}

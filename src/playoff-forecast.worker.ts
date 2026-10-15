import { forecastPlayoffsCooperatively } from './playoff-forecast';
import type { ForecastWorkerInput, ForecastWorkerResponse } from './playoff-forecast-worker-client';

self.onmessage = async ({ data }: MessageEvent<ForecastWorkerInput & { id: number }>) => {
  let response: ForecastWorkerResponse;
  try {
    response = {
      id: data.id,
      result: await forecastPlayoffsCooperatively(
        data.data,
        data.settings,
        data.cutoff,
        undefined,
        data.simulations,
        data.scoreModel,
      ),
    };
  } catch (error) {
    response = {
      id: data.id,
      error: {
        name: error instanceof Error ? error.name : 'Error',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
  self.postMessage(response);
};

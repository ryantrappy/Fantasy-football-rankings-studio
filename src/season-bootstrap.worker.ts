import {
  runBootstrapSeasons,
  type BootstrapLeague,
  type BootstrapOptions,
  type BootstrapResult,
} from './season-bootstrap';

export type BootstrapWorkerReply =
  | { progress: number }
  | { result: BootstrapResult }
  | { error: string };

self.onmessage = ({
  data,
}: MessageEvent<{ league: BootstrapLeague; options: BootstrapOptions }>) => {
  const send = (reply: BootstrapWorkerReply) => self.postMessage(reply);
  void runBootstrapSeasons(
    data.league,
    data.options,
    (progress) => send({ progress }),
    new AbortController().signal,
  ).then(
    (result) => send({ result }),
    (error: unknown) =>
      send({ error: error instanceof Error ? error.message : 'Simulation failed.' }),
  );
};

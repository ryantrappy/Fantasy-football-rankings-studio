// Shared across reports and provider instances so concurrent seasons stay bounded.
const maximum = 6;
let active = 0;
const waiting: (() => void)[] = [];

export function providerRequest<T>(read: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const start = () => {
      active++;
      void (async () => {
        try {
          resolve(await read());
        } catch (error) {
          reject(error);
        } finally {
          active--;
          waiting.shift()?.();
        }
      })();
    };
    if (active < maximum) start();
    else waiting.push(start);
  });
}

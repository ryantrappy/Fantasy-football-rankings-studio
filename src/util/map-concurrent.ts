// Keep every slot busy while retaining input order in the returned results.
export async function mapConcurrent<T, R>(
  items: readonly T[],
  concurrency: number,
  read: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  let failed = false;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (!failed && next < items.length) {
        const index = next++;
        try {
          results[index] = await read(items[index]);
        } catch (error) {
          failed = true;
          throw error;
        }
      }
    }),
  );
  return results;
}

// Hold fixture data until the test releases it, so loading layouts can be inspected.
const ready = new URLSearchParams(location.search).has('loading')
  ? new Promise<void>((resolve) =>
      document.addEventListener('preview-data-ready', () => resolve(), { once: true }),
    )
  : Promise.resolve();

export async function afterPreviewData<T>(value: T): Promise<T> {
  await ready;
  return value;
}

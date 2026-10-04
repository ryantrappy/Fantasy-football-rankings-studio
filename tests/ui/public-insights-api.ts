// Report fixtures supply their API directly and must never invoke server functions.
export function createPublicInsightsApi(): never {
  throw new Error('UI previews must use their supplied report API.');
}

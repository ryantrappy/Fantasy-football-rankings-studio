import '@tanstack/react-start/server-only';
import { createHash } from 'node:crypto';
import type { PlayoffProjection } from '../../insights';
import { connectDatabase } from '../database.server';
import { seasonProjectionCacheModel } from '../models/season-projection-cache.model';
import { logServerError } from '../logging.server';

const freshFor = 60 * 60 * 1000;
const retainFor = 24 * freshFor;

// Sort object keys so equivalent scoring/roster maps share a cache entry.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

function complete(projection: PlayoffProjection) {
  const teams = Object.keys(projection.teamPoints);
  return (
    projection.optimizedLineup &&
    projection.totalStarters > 0 &&
    projection.coveredStarters === projection.totalStarters &&
    teams.length > 0 &&
    teams.every((id) => {
      const points = projection.positionPoints?.[id];
      return (
        Number.isFinite(projection.teamPoints[id]) &&
        points &&
        Object.keys(points).length > 0 &&
        Object.values(points).every(Number.isFinite) &&
        Math.abs(Object.values(points).reduce((a, b) => a + b, 0) - projection.teamPoints[id]) <=
          0.01
      );
    })
  );
}

export async function cachedFutureProjection(
  context: unknown,
  read: () => Promise<PlayoffProjection>,
): Promise<PlayoffProjection> {
  const key = createHash('sha256')
    .update(canonical({ version: 1, context }))
    .digest('hex');
  let cached: { capturedAt: Date; projection: PlayoffProjection } | undefined;
  let storageAvailable = false;
  try {
    await connectDatabase();
    storageAvailable = true;
    const found = await seasonProjectionCacheModel
      .findOne({ key, expiresAt: { $gt: new Date() } })
      .lean();
    if (found && complete(found.projection)) cached = found as typeof cached;
  } catch (error) {
    logServerError('insights.readProjectionCache', error, 500);
  }
  const reuse = (stale: boolean): PlayoffProjection => ({
    ...cached!.projection,
    capturedAt: new Date(cached!.capturedAt).toISOString(),
    note: `${cached!.projection.note ? `${cached!.projection.note} ` : ''}${stale ? 'Provider refresh unavailable; using cached' : 'Using cached'} week ${cached!.projection.week} projections captured ${new Date(cached!.capturedAt).toISOString()}.`,
  });
  if (cached && Date.now() - new Date(cached.capturedAt).getTime() < freshFor) return reuse(false);

  let projection: PlayoffProjection;
  try {
    projection = await read();
  } catch (error) {
    if (cached) return reuse(true);
    throw error;
  }
  // Empty/partial responses must not replace a complete saved breakdown.
  if (!complete(projection)) return cached ? reuse(true) : projection;
  const capturedAt = new Date();
  projection = { ...projection, capturedAt: capturedAt.toISOString() };
  if (!storageAvailable) return projection;
  try {
    await seasonProjectionCacheModel.updateOne(
      { key },
      { $set: { capturedAt, expiresAt: new Date(+capturedAt + retainFor), projection } },
      { upsert: true },
    );
  } catch (error) {
    logServerError('insights.writeProjectionCache', error, 500);
  }
  return projection;
}

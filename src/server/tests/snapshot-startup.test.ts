// @vitest-environment node
import mongoose from 'mongoose';
import { connectDatabase } from '../database.server';
import { reportSnapshotModel } from '../models/report-snapshot.model';

it('initializes the expiry index and removes overdue snapshots when connecting after startup', async () => {
  vi.stubEnv('MONGODB_URI', 'mongodb://example.invalid/test');
  const connect = vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
  const inits = Object.values(mongoose.models).map((model) =>
    vi.spyOn(model, 'init').mockResolvedValue(model),
  );
  const cleanup = vi
    .spyOn(reportSnapshotModel, 'deleteMany')
    .mockResolvedValue({ acknowledged: true, deletedCount: 3 });
  try {
    await connectDatabase();
    await connectDatabase();
    expect(connect).toHaveBeenCalledTimes(1);
    expect(inits.every((init) => init.mock.calls.length === 1)).toBe(true);
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(cleanup).toHaveBeenCalledWith({ expiresAt: { $lte: expect.any(Date) } });
  } finally {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  }
});

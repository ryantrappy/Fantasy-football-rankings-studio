import '@tanstack/react-start/server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { connectDatabase } from './database.server';
import LeaguesService from './services/leagues.service';
import { leagueSchema } from './validation';
import { snapshotInputSchema } from './report-snapshot-schema';
import HttpException from './exceptions/HttpException';
import type { ReportSnapshot } from '../report-snapshot';
import { reportSnapshotModel } from './models/report-snapshot.model';
export { reportSnapshotModel } from './models/report-snapshot.model';
const leagues = new LeaguesService();
export const reportSnapshots = {
  async create(owner: string, input: unknown) {
    const { leagueId } = snapshotInputSchema.pick({ leagueId: true }).parse(input);
    await connectDatabase();
    const league = await leagues.getLeagueById(leagueId, owner);
    if (league.leagueType !== 1) throw new HttpException(400, 'Snapshots are for ESPN reports.');
    if (league.publicReports === false)
      throw new HttpException(409, 'Enable public report sharing before creating a snapshot.');
    const report = snapshotInputSchema.parse(input);
    if (Buffer.byteLength(JSON.stringify(report)) > 12 * 1024 * 1024)
      throw new HttpException(413, 'This snapshot is too large. Select fewer seasons and retry.');
    // Preserve manager matching without publishing provider account identifiers.
    const keys = new Map<string, string>();
    const publicKey = (key: string) => {
      if (!keys.has(key)) keys.set(key, `manager-${keys.size + 1}`);
      return keys.get(key)!;
    };
    for (const record of report.records)
      for (const team of record.data.teams)
        if (team.managerKey) team.managerKey = publicKey(team.managerKey);
    report.activeManagerKeys = report.activeManagerKeys.map(publicKey);
    const publicId = randomUUID();
    const now = new Date();
    const savedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    await reportSnapshotModel.create({
      publicId,
      savedAt,
      expiresAt,
      ownerSubject: owner,
      leagueId,
      league: leagueSchema.parse(league),
      report,
    });
    return { publicId, savedAt, expiresAt: expiresAt.toISOString() };
  },
  async read(input: unknown): Promise<ReportSnapshot> {
    const { publicId } = z.object({ publicId: z.string().uuid() }).parse(input);
    await connectDatabase();
    const found = await reportSnapshotModel.findOne({ publicId });
    if (!found || new Date(found.expiresAt).getTime() <= Date.now())
      throw new HttpException(
        404,
        'This report snapshot is unavailable or has expired. Ask the owner for a new link.',
      );
    // Check the original owner workspace so another registration cannot re-enable a link.
    const league = await leagues.getLeagueById(found.leagueId, found.ownerSubject);
    if (league.publicReports === false)
      throw new HttpException(404, 'This report snapshot is unavailable or sharing is disabled.');
    const report = snapshotInputSchema.parse(found.report);
    return {
      publicId,
      savedAt: found.savedAt,
      expiresAt: new Date(found.expiresAt).toISOString(),
      league: leagueSchema.parse(found.league),
      view: report.view,
      records: report.records,
      activeSeason: report.activeSeason,
      activeManagerKeys: report.activeManagerKeys,
    };
  },
};

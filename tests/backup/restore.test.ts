import { it, expect, vi } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import RankingsService from '../../src/server/services/rankings.service';
import LeaguesService from '../../src/server/services/leagues.service';
import leagueModel from '../../src/server/models/league.model';
import rankingModel from '../../src/server/models/weeklyRanking.model';
import credentialModel from '../../src/server/models/espn-credentials.model';
import { encryptCredentials, decryptCredentials } from '../../src/server/espn-credentials.server';

async function run(command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const process = spawn(command, args, { stdio: 'ignore' });
    process.once('error', () =>
      reject(new Error(`${command} could not start; install MongoDB Database Tools.`)),
    );
    process.once('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} failed with exit ${code}.`)),
    );
  });
}
it('restores editions, indexes, publications and owner-bound credentials into an isolated database', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'fantasy-backup-check-'));
  const listener = createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const address = listener.address();
  if (!address || typeof address === 'string') throw new Error('No port');
  const port = address.port;
  await new Promise<void>((resolve) => listener.close(() => resolve()));
  let daemon: ChildProcess | undefined;
  try {
    daemon = spawn(
      'mongod',
      ['--dbpath', scratch, '--port', String(port), '--bind_ip', '127.0.0.1', '--quiet'],
      { stdio: 'ignore' },
    );
    let startError: Error | undefined;
    daemon.on('error', (error) => {
      startError = error;
    });
    const uri = `mongodb://127.0.0.1:${port}`;
    let connected = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      if (startError) throw new Error('mongod could not start; install MongoDB Community Server.');
      if (daemon.exitCode !== null) throw new Error('Disposable mongod exited during startup.');
      try {
        await mongoose.connect(`${uri}/backup_source`, { serverSelectionTimeoutMS: 250 });
        connected = true;
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    if (!connected) throw new Error('Disposable database did not become ready.');
    vi.stubEnv('ESPN_CREDENTIALS_KEY', randomBytes(32).toString('hex'));
    await leagueModel.create([
      {
        leagueId: '101',
        leagueName: 'Owner A',
        leagueType: 0,
        seasonId: 2026,
        ownerSubject: 'owner-a',
      },
      {
        leagueId: '202',
        leagueName: 'Owner B',
        leagueType: 0,
        seasonId: 2026,
        ownerSubject: 'owner-b',
      },
    ]);
    await rankingModel.init();
    const teams = [
      {
        teamId: '1',
        teamName: 'Team',
        managerName: 'A',
        description: 'Restored commentary',
        position: 1,
        wins: 2,
        loss: 1,
        ties: 0,
      },
    ];
    const saved = await rankingModel.create({
      leagueId: '101',
      year: 2026,
      week: 3,
      rankingsTitle: 'Backup edition',
      introduction: 'Keep this text',
      revision: 7,
      teams,
    });
    const credentials = {
      espnS2: 'synthetic-cookie',
      swid: '11111111-1111-1111-1111-111111111111',
    };
    const encrypted = encryptCredentials('owner-a', credentials);
    await credentialModel.create({
      _id: 'owner-a',
      encryptedCredentials: encrypted,
      onboardingComplete: true,
    });
    await mongoose.connection.db!.collection('publications').insertOne({
      rankingId: String(saved._id),
      publicId: 'synthetic-public-id',
      ranking: { rankingsTitle: 'Published snapshot' },
      revision: 6,
      publishedAt: '2026-09-01',
    });
    await mongoose.connection
      .db!.collection('publications')
      .createIndex({ publicId: 1 }, { unique: true });
    const archive = join(scratch, 'backup.archive.gz');
    await run('mongodump', [
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--db',
      'backup_source',
      `--archive=${archive}`,
      '--gzip',
    ]);
    await run('mongorestore', [
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      `--archive=${archive}`,
      '--gzip',
      '--nsInclude=backup_source.*',
      '--nsFrom=backup_source.*',
      '--nsTo=backup_restored.*',
    ]);
    await mongoose.disconnect();
    await mongoose.connect(`${uri}/backup_restored`);
    const rankings = new RankingsService(),
      leagues = new LeaguesService();
    const restored = await rankings.getRankingById(String(saved._id), 'owner-a');
    expect(restored.rankingsTitle).toBe('Backup edition');
    expect(restored.teams[0].description).toBe('Restored commentary');
    expect(restored.revision).toBe(7);
    await expect(rankings.getRankingById(String(saved._id), 'owner-b')).rejects.toMatchObject({
      status: 404,
    });
    await expect(leagues.getLeagueById('202', 'owner-a')).rejects.toMatchObject({ status: 404 });
    const record = await credentialModel.findById('owner-a').select('+encryptedCredentials');
    expect(decryptCredentials('owner-a', record!.encryptedCredentials!)).toEqual(credentials);
    expect(() => decryptCredentials('owner-b', record!.encryptedCredentials!)).toThrow();
    const indexes = await rankingModel.collection.indexes();
    expect(
      indexes.some(
        (index) =>
          index.unique && index.key.leagueId === 1 && index.key.year === 1 && index.key.week === 1,
      ),
    ).toBe(true);
    expect(
      await mongoose.connection
        .db!.collection('publications')
        .findOne({ publicId: 'synthetic-public-id' }),
    ).toMatchObject({ revision: 6, ranking: { rankingsTitle: 'Published snapshot' } });
    // Exercise actual MongoDB compare-and-swap after restoration, not just a query mock.
    const results = await Promise.allSettled([
      rankings.updateRanking(
        String(saved._id),
        {
          leagueId: restored.leagueId,
          year: restored.year,
          week: restored.week,
          introduction: restored.introduction,
          teams: restored.teams,
          revision: restored.revision,
          rankingsTitle: 'Writer A',
        },
        'owner-a',
      ),
      rankings.updateRanking(
        String(saved._id),
        {
          leagueId: restored.leagueId,
          year: restored.year,
          week: restored.week,
          introduction: restored.introduction,
          teams: restored.teams,
          revision: restored.revision,
          rankingsTitle: 'Writer B',
        },
        'owner-a',
      ),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    await leagues.setArchived('101', true, 'owner-a');
    expect(await leagues.listLeagues('owner-a')).toHaveLength(0);
    expect(await leagues.listLeagues('owner-a', true)).toHaveLength(1);
    expect(
      (await rankings.getRankingById(String(saved._id), 'owner-a')).rankingsTitle,
    ).toBeDefined();
    expect((await leagues.getPublicLeagueById('101')).leagueId).toBe('101');
    await expect(leagues.setArchived('101', false, 'owner-b')).rejects.toMatchObject({
      status: 404,
    });
    await leagues.setArchived('101', false, 'owner-a');
    expect(await leagues.listLeagues('owner-a')).toHaveLength(1);
    await leagues.setReportSharing('101', false, 'owner-a');
    await expect(leagues.getPublicLeagueById('101')).rejects.toMatchObject({ status: 404 });
    expect((await leagues.getLeagueById('101', 'owner-a')).leagueId).toBe('101');
    await expect(leagues.setReportSharing('101', true, 'owner-b')).rejects.toMatchObject({
      status: 404,
    });
    await leagues.setReportSharing('101', true, 'owner-a');
    expect((await leagues.getPublicLeagueById('101')).leagueId).toBe('101');
    const history = await rankings.getRevisions(String(saved._id), 'owner-a');
    expect(history.map((entry) => entry.ranking.revision)).toEqual([8, 7]);
    const restoredOld = await rankings.restoreRevision(String(saved._id), 7, 8, 'owner-a');
    expect(restoredOld.revision).toBe(9);
    expect(restoredOld.rankingsTitle).toBe('Backup edition');
    expect(restoredOld.teams[0].description).toBe('Restored commentary');
    expect(
      (await rankings.getRevisions(String(saved._id), 'owner-a')).map(
        (entry) => entry.ranking.revision,
      ),
    ).toEqual([9, 8, 7]);
    await expect(rankings.getRevisions(String(saved._id), 'owner-b')).rejects.toMatchObject({
      status: 404,
    });
  } finally {
    vi.unstubAllEnvs();
    await mongoose.disconnect();
    if (daemon?.pid && daemon.exitCode === null) {
      const exited = once(daemon, 'exit');
      daemon.kill('SIGTERM');
      await exited;
    }
    await rm(scratch, { recursive: true, force: true });
  }
});

// Exercises the built Start server over HTTP with real JWT verification and live providers.
// The signing key, issuer and database are disposable and never used by the normal app.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { toJSON, fromCrossJSON } from 'seroval';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'], quiet: true });
const buildFiles = await readdir('.output/server/_ssr');
const bundles = await Promise.all(
  buildFiles
    .filter((file) => file.includes('.functions-'))
    .map((file) => readFile(`.output/server/_ssr/${file}`, 'utf8')),
);
const ids = Object.fromEntries(
  [...bundles.join('\n').matchAll(/id: "([^"]+)",\s*name: "([^"]+)"/g)].map((match) => [
    match[2],
    match[1],
  ]),
);
assert.equal(Object.keys(ids).length, 19, 'Build server functions before running this check');
const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = { ...(await exportJWK(publicKey)), kid: 'local-check', alg: 'RS256', use: 'sig' };
const issuerServer = createServer((_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ keys: [jwk] }));
});
issuerServer.listen(0, '127.0.0.1');
await once(issuerServer, 'listening');
const issuer = `http://127.0.0.1:${issuerServer.address().port}/`;
const port = Number(process.env.TEST_PORT || 3101);
const origin = `http://127.0.0.1:${port}`;
const dbName = `fantasy_start_check_${randomUUID().replaceAll('-', '')}`;
// Replace only the database path, preserving credentials/options, without ever printing the URI.
const baseUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fantasy_rankings';
const uri = baseUri.replace(/(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/[^?]*)?(.*)/, `$1/${dbName}$2`);
assert.ok(uri.includes(`/${dbName}`));
const app = spawn(process.execPath, ['.output/server/index.mjs'], {
  env: {
    ...process.env,
    PORT: String(port),
    HOST: '127.0.0.1',
    MONGODB_URI: uri,
    AUTH0_ISSUER_BASE_URL: issuer,
    AUTH0_AUDIENCE: 'local-check',
  },
  stdio: 'ignore',
});
async function token(subject, audience = 'local-check') {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: 'local-check' })
    .setSubject(subject)
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime('5m')
    .sign(privateKey);
}
async function rpc(name, data, auth, status = 200) {
  const method = ['createLeague', 'saveRanking', 'updateRankingByWeek'].includes(name)
    ? 'POST'
    : 'GET';
  const payload = JSON.stringify(toJSON({ data }));
  const response = await fetch(
    `${origin}/_serverFn/${ids[name]}${method === 'GET' ? `?payload=${encodeURIComponent(payload)}` : ''}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-tsr-serverFn': 'true',
        Origin: origin,
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
      ...(method === 'POST' ? { body: payload } : {}),
      signal: AbortSignal.timeout(120000),
    },
  );
  assert.equal(response.status, status, `${name} status`);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const result = fromCrossJSON(await response.json(), {}).result;
  assert.equal(result.ok, status === 200, name);
  return result.data;
}
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (app.exitCode !== null) throw new Error('Test app could not start; check TEST_PORT');
    try {
      ready = (await fetch(`${origin}/health`)).ok;
    } catch {}
    if (ready) break;
    await delay(250);
  }
  assert.ok(ready, 'Test app must connect to MongoDB');
  assert.equal((await fetch(origin)).status, 200);
  const owner = await token('local-check-owner');
  const other = await token('local-check-other');
  await rpc('listLeagues', undefined, undefined, 401);
  await rpc('listLeagues', undefined, await token('local-check-owner', 'wrong'), 401);
  await rpc('createLeague', {}, owner, 400);
  for (const name of ['createLeague', 'saveRanking', 'updateRankingByWeek'])
    await rpc(name, {}, undefined, 401);
  await rpc('getPublicLeague', { leagueId: 'invalid' }, undefined, 400);
  await rpc('getPublicLeague', { leagueId: '999999999999999999999999999999' }, undefined, 404);
  const year = Number(process.env.TEST_SEASON || 2026);
  for (const [leagueType, leagueId] of [
    [0, process.env.TEST_SLEEPER_LEAGUE_ID || '1312529175982129152'],
    [1, process.env.TEST_ESPN_LEAGUE_ID || '1140768'],
  ]) {
    const league = await rpc(
      'createLeague',
      { leagueId, leagueType, leagueName: '', seasonId: year, ownerSubject: 'forged-owner' },
      owner,
    );
    assert.equal(league.leagueId, leagueId);
    assert.ok(!('ownerSubject' in league));
    await rpc('getLeague', { leagueId }, other, 404);
    await rpc('createLeague', { ...league, _id: undefined }, owner, 409);
    await rpc('getLeagueInfo', { leagueId, year }, owner);
    await rpc('getInsights', { leagueId, year }, other, 404);
    await rpc('getInsights', { leagueId, year }, undefined, 401);
    await rpc('getLeagueSeasons', { leagueId }, other, 404);
    await rpc('getLeagueSeasons', { leagueId }, undefined, 401);
    const publicLeague = await rpc('getPublicLeague', { leagueId });
    assert.equal(publicLeague.leagueId, leagueId);
    assert.ok(!('ownerSubject' in publicLeague));
    assert.ok(!('_id' in publicLeague));
    for (const path of [
      `/insights?leagueId=${leagueId}&year=${year}`,
      `/history?leagueId=${leagueId}`,
    ]) {
      const response = await fetch(`${origin}${path}`);
      assert.equal(response.status, 200);
      assert.ok(!(await response.text()).includes('Sign in to manage leagues'));
    }
    const history = await rpc('getPublicLeagueSeasons', { leagueId });
    assert.ok(history.years.includes(2025));
    assert.ok(history.activeManagerKeys.length > 0);
    const insightYear = Number(process.env.TEST_INSIGHTS_SEASON || 2025);
    const insights = await rpc('getPublicInsights', { leagueId, year: insightYear });
    assert.ok(insights.completedWeek > 0);
    assert.ok(insights.scores.length > 0);
    assert.ok(
      insights.scores.some((s) => s.opponentTeamId),
      'Regular-season opponents available for luck',
    );
    const ratedPickups = insights.pickups.filter((p) => p.lift !== null);
    assert.ok(ratedPickups.length > 0, 'Provider must populate positional pickup comparisons');
    assert.ok(
      ratedPickups.every(
        (p) => p.position && p.comparisonWeeks.length >= 2 && Number.isFinite(p.lift),
      ),
    );
    assert.ok(
      insights.tradeComparisons.every(
        (t) => t.weeks.length <= 4 && (!t.winner || t.weeks.length >= 2),
      ),
    );
    console.log(
      `Normalized comparisons: ${ratedPickups.length} rated pickups, ${insights.tradeComparisons.length} trades, ${insights.tradeComparisons.filter((t) => t.winner).length} scoring leaders`,
    );
    assert.equal(
      new Set(insights.scores.map((s) => `${s.teamId}:${s.week}`)).size,
      insights.scores.length,
    );
    assert.ok(insights.scores.every((s) => s.week <= insights.completedWeek));
    if (leagueType === 1) assert.ok(insights.scores.some((s) => s.projected !== null));
    console.log(
      `${leagueType === 0 ? 'Sleeper' : 'ESPN'} ${insightYear} insights: ${insights.scores.length} team-weeks, ${insights.trades.length} trade sides, ${insights.pickups.length} pickups`,
    );

    const teams = await rpc('getTeams', { leagueId, year, week: 1 }, owner);
    const matchups = await rpc('getMatchups', { leagueId, year, week: 1 }, owner);
    assert.ok(teams.length > 0);
    assert.ok(matchups.length > 0);
    const draft = {
      leagueId,
      year,
      week: 1,
      rankingsTitle: 'Integration check',
      introduction: '',
      teams: teams.map((team, i) => ({ ...team, description: '', position: i + 1 })),
    };
    const saved = await rpc('saveRanking', draft, owner);
    await rpc('saveRanking', draft, owner, 409);
    await rpc('getRanking', { id: saved._id }, other, 404);
    await rpc('saveRanking', { ...saved, rankingsTitle: 'Unauthorized' }, other, 404);
    const updated = await rpc(
      'saveRanking',
      { ...saved, rankingsTitle: 'Updated', teams: [...saved.teams].reverse() },
      owner,
    );
    assert.equal(updated.teams[0].teamId, saved.teams.at(-1).teamId);
    assert.equal(updated.teams[0].position, 1);
    await rpc(
      'updateRankingByWeek',
      { leagueId, year, week: 1, ranking: { ...updated, introduction: 'Persisted' } },
      owner,
    );
    const reloaded = await rpc('getRanking', { id: saved._id }, owner);
    assert.equal(reloaded.rankingsTitle, 'Updated');
    assert.equal(reloaded.introduction, 'Persisted');
    assert.equal((await rpc('getRankings', { leagueId }, owner)).length, 1);
    await rpc('getTeams', { leagueId, year, week: 19 }, owner, 400);
    console.log(
      `${leagueType === 0 ? 'Sleeper' : 'ESPN'}: ${teams.length} teams, ${matchups.length} matchups; create/update/reload and ownership passed`,
    );
  }
  assert.equal((await rpc('listLeagues', undefined, owner)).length, 2);
  assert.deepEqual(await rpc('listLeagues', undefined, other), []);
  console.log('Production Start HTTP integration passed; no separate API server used.');
} finally {
  if (app.exitCode === null) {
    const exited = once(app, 'exit');
    app.kill('SIGTERM');
    const forceStop = setTimeout(() => app.kill('SIGKILL'), 2000);
    await exited;
    clearTimeout(forceStop);
  }
  issuerServer.close();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  assert.equal(mongoose.connection.name, dbName);
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  console.log('Disposable test database removed.');
}

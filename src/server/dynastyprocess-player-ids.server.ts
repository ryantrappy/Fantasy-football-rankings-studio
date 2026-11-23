import '@tanstack/react-start/server-only';
import axios from 'axios';
import { parse } from 'csv-parse/sync';

const repository = 'dynastyprocess/data';
const path = 'files/db_playerids.csv';
const day = 24 * 60 * 60 * 1000;
const maxSnapshotAge = 45 * day;
const retryDelay = 15 * 60 * 1000;
const numericId = /^[1-9]\d{0,17}$/;

type IdIndex = Map<string, Set<string>>;

export interface DynastyProcessSnapshot {
  revision: string;
  updatedAt: string;
  bySleeper: IdIndex;
  byEspn: IdIndex;
}

function addLink(index: IdIndex, id: string, other: string) {
  const matches = index.get(id);
  if (matches) matches.add(other);
  else index.set(id, new Set([other]));
}

function parseCrosswalk(csv: string): Pick<DynastyProcessSnapshot, 'bySleeper' | 'byEspn'> {
  const bySleeper: IdIndex = new Map();
  const byEspn: IdIndex = new Map();
  const rows: Record<'sleeper_id' | 'espn_id', string>[] = parse(csv, {
    bom: true,
    skip_empty_lines: true,
    max_record_size: 8192,
    columns: (headers: string[]) => {
      if (
        new Set(headers).size !== headers.length ||
        !headers.includes('sleeper_id') ||
        !headers.includes('espn_id')
      )
        throw new Error('DynastyProcess crosswalk schema is unavailable.');
      // Skip unrelated columns, including names. Identify players using provider IDs.
      return headers.map((header) => (['sleeper_id', 'espn_id'].includes(header) ? header : false));
    },
  });
  for (const { sleeper_id, espn_id } of rows) {
    if (!numericId.test(sleeper_id) || !numericId.test(espn_id)) continue;
    addLink(bySleeper, sleeper_id, espn_id);
    addLink(byEspn, espn_id, sleeper_id);
  }
  if (!bySleeper.size) throw new Error('DynastyProcess crosswalk has no valid ID pairs.');
  return { bySleeper, byEspn };
}

function fresh(updatedAt: string) {
  const age = Date.now() - Date.parse(updatedAt);
  return age >= 0 && age <= maxSnapshotAge;
}

let cached: DynastyProcessSnapshot | undefined;
let pending: Promise<DynastyProcessSnapshot | undefined> | undefined;
let nextReadAt = 0;

async function refresh() {
  const signal = AbortSignal.timeout(3000);
  const { data } = await axios.get<{ sha?: string; commit?: { committer?: { date?: string } } }[]>(
    `https://api.github.com/repos/${repository}/commits`,
    {
      params: { sha: 'master', path, per_page: 1 },
      signal,
      timeout: 3000,
      maxContentLength: 64_000,
    },
  );
  const revision = data?.[0]?.sha;
  const updatedAt = data?.[0]?.commit?.committer?.date;
  if (
    typeof revision !== 'string' ||
    !/^[a-f0-9]{40}$/.test(revision) ||
    typeof updatedAt !== 'string' ||
    !fresh(updatedAt)
  )
    throw new Error('DynastyProcess crosswalk is stale or missing its revision.');
  if (cached?.revision === revision) return cached;
  const { data: csv } = await axios.get<string>(
    `https://raw.githubusercontent.com/${repository}/${revision}/${path}`,
    { responseType: 'text', signal, timeout: 3000, maxContentLength: 5_000_000 },
  );
  return { revision, updatedAt, ...parseCrosswalk(csv) };
}

export async function loadDynastyProcessPlayerIds() {
  if (pending) return pending;
  const usable = cached && fresh(cached.updatedAt) ? cached : undefined;
  if (Date.now() < nextReadAt) return usable;
  pending = refresh()
    .then((snapshot) => {
      cached = snapshot;
      nextReadAt = Date.now() + day;
      return snapshot;
    })
    .catch(() => {
      nextReadAt = Date.now() + retryDelay;
      return cached && fresh(cached.updatedAt) ? cached : undefined;
    })
    .finally(() => {
      pending = undefined;
    });
  return pending;
}

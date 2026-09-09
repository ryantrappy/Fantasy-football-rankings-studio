import type { WeeklyRanking } from './types';
import { rankingSignature } from './util/rankings';
export function draftKey(
  subject: string | undefined,
  leagueId: string,
  year: number,
  week: number,
) {
  return subject
    ? `ranking-draft:v1:${JSON.stringify([subject, leagueId, year, week])}`
    : undefined;
}
export function readDraft(
  key: string | undefined,
  selection: { leagueId: string; year: number; week: number },
): WeeklyRanking | undefined {
  if (!key) return;
  const raw = window.localStorage.getItem(key);
  if (!raw) return;
  const draft = JSON.parse(raw) as WeeklyRanking;
  if (
    !draft ||
    draft.leagueId !== selection.leagueId ||
    draft.year !== selection.year ||
    draft.week !== selection.week ||
    typeof draft.rankingsTitle !== 'string' ||
    typeof draft.introduction !== 'string' ||
    !Array.isArray(draft.teams) ||
    draft.teams.length > 100 ||
    !draft.teams.every(
      (t) =>
        t &&
        typeof t.teamId === 'string' &&
        typeof t.teamName === 'string' &&
        typeof t.managerName === 'string' &&
        typeof t.description === 'string' &&
        [t.position, t.wins, t.loss, t.ties].every(Number.isFinite),
    )
  )
    throw new Error('Invalid recovery snapshot.');
  return draft;
}
export function writeDraft(key: string | undefined, ranking: WeeklyRanking) {
  if (key) window.localStorage.setItem(key, JSON.stringify(ranking));
}
export function clearSavedDraft(key: string | undefined, ranking: WeeklyRanking) {
  if (!key) return;
  const stored = readDraft(key, ranking);
  if (stored && rankingSignature(stored) === rankingSignature(ranking))
    window.localStorage.removeItem(key);
}

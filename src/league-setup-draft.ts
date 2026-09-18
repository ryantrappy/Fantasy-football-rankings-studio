export interface LeagueSetupDraft {
  leagueId: string;
  leagueName: string;
  leagueType: 0 | 1;
  seasonId: number;
}

const storageKey = (subject: string) => `fantasy-rankings:league-setup:${subject}`;

export function readLeagueSetupDraft(subject?: string): LeagueSetupDraft | null {
  if (!subject || typeof sessionStorage === 'undefined') return null;
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(storageKey(subject)) || 'null');
    if (!value || typeof value !== 'object') return null;
    const draft = value as Partial<LeagueSetupDraft>;
    return typeof draft.leagueId === 'string' &&
      typeof draft.leagueName === 'string' &&
      (draft.leagueType === 0 || draft.leagueType === 1) &&
      Number.isInteger(draft.seasonId) &&
      draft.seasonId! >= 2000 &&
      draft.seasonId! <= 2100
      ? (draft as LeagueSetupDraft)
      : null;
  } catch {
    return null;
  }
}

export function writeLeagueSetupDraft(subject: string | undefined, draft: LeagueSetupDraft) {
  if (!subject || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(storageKey(subject), JSON.stringify(draft));
  } catch {
    // Form persistence is a convenience; browser storage failures must not block league setup.
  }
}

export function clearLeagueSetupDraft(subject?: string) {
  if (!subject || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(storageKey(subject));
  } catch {
    // The form remains usable when browser storage is unavailable.
  }
}

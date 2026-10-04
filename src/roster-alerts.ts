import type { LiveTeam } from './live-matchups';
import { unavailableStatus } from './server/insights/projections';
export interface RosterAlert {
  id: string;
  severity: 'High' | 'Warning' | 'Info';
  message: string;
  playerId?: string;
  week: number;
  timestamp: string;
}
export function rosterAlerts(
  team: LiveTeam,
  leagueId: string,
  year: number,
  week: number,
  capturedAt?: string,
  slots?: string[],
  now = Date.now(),
): RosterAlert[] {
  const alerts = new Map<string, RosterAlert>();
  function add(
    condition: string,
    severity: RosterAlert['severity'],
    message: string,
    playerId?: string,
  ) {
    const id = JSON.stringify([leagueId, year, week, team.teamId, playerId ?? '', condition]);
    alerts.set(id, {
      id,
      severity,
      message,
      playerId,
      week,
      timestamp: capturedAt ?? 'Unavailable',
    });
  }
  const timestamp = capturedAt ? new Date(capturedAt).getTime() : Number.NaN;
  if (!Number.isFinite(timestamp) || now - timestamp > 5 * 60_000 || timestamp > now + 60_000) {
    add(
      'stale',
      'Warning',
      'Roster/status inputs are stale or unavailable. Refresh before evaluating current injury or lineup risks.',
    );
    return [...alerts.values()];
  }
  const starters = team.players.filter((player) => player.starter);
  for (const player of starters) {
    if (unavailableStatus(player.availability))
      add(
        `unavailable:${player.availability}`,
        'High',
        `${player.name} is a starter with confirmed ${player.availability} status. Review a replacement.`,
        player.id,
      );
    else if (['QUESTIONABLE', 'DOUBTFUL'].includes((player.availability ?? '').toUpperCase()))
      add(
        `uncertain:${player.availability}`,
        'Warning',
        `${player.name} has uncertain ${player.availability} availability. Recheck before kickoff.`,
        player.id,
      );
    if (player.bye === true)
      add(
        'bye',
        'High',
        `${player.name} is starting during a known bye week. Review an active replacement.`,
        player.id,
      );
    if (player.projectedPoints === undefined || !Number.isFinite(player.projectedPoints))
      add(
        'projection-gap',
        'Info',
        `${player.name} has no usable weekly projection. Lineup improvement cannot be fully evaluated.`,
        player.id,
      );
    if (player.locked === undefined)
      add(
        'lock-unknown',
        'Info',
        `${player.name} game/lineup lock status is unknown. Confirm changes with the provider.`,
        player.id,
      );
  }
  if (!slots?.length)
    add(
      'slots-unknown',
      'Info',
      'Configured lineup coverage is unavailable. Verify required slots at your provider.',
    );
  else if (starters.length < slots.length)
    add(
      'lineup-gap',
      'High',
      `${slots.length - starters.length} configured starter slot(s) are unfilled in the available roster snapshot. Review your lineup.`,
    );
  return [...alerts.values()].sort(
    (a, b) =>
      ['High', 'Warning', 'Info'].indexOf(a.severity) -
        ['High', 'Warning', 'Info'].indexOf(b.severity) || a.id.localeCompare(b.id),
  );
}
const key = (subject?: string) =>
  subject ? `roster-alert-dismissals:v1:${JSON.stringify(subject)}` : undefined;
export function readAlertDismissals(subject?: string): string[] {
  const storageKey = key(subject);
  if (!storageKey || typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === 'string').slice(-200)
      : [];
  } catch {
    return [];
  }
}
export function saveAlertDismissals(subject: string | undefined, ids: string[]) {
  const storageKey = key(subject);
  if (!storageKey || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify([...new Set(ids)].slice(-200)));
  } catch {
    /* Browser privacy settings can prevent persistence. */
  }
}

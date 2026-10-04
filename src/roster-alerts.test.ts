import { rosterAlerts, readAlertDismissals, saveAlertDismissals } from './roster-alerts';
import type { LiveTeam } from './live-matchups';
const now = new Date('2026-10-01T12:00:00Z').getTime();
const capturedAt = new Date(now).toISOString();
const team = (): LiveTeam => ({
  teamId: '1',
  name: 'Me',
  score: null,
  players: [
    {
      id: 'a',
      name: 'Starter',
      starter: true,
      position: 'RB',
      points: null,
      projectedPoints: 10,
      availability: 'OUT',
      bye: false,
      locked: false,
    },
  ],
});
it('tracks confirmed/uncertain/resolved transitions and deduplicates repeated snapshots', () => {
  const data = team();
  const alerts = rosterAlerts(data, '10', 2026, 5, capturedAt, ['RB'], now);
  expect(alerts).toHaveLength(1);
  expect(alerts[0]).toMatchObject({
    severity: 'High',
    playerId: 'a',
    week: 5,
    timestamp: capturedAt,
  });
  data.players.push({ ...data.players[0] });
  expect(
    rosterAlerts(data, '10', 2026, 5, capturedAt, ['RB'], now).map((alert) => alert.id),
  ).toEqual(alerts.map((alert) => alert.id));
  data.players = [data.players[0]];
  data.players[0].availability = 'QUESTIONABLE';
  expect(rosterAlerts(data, '10', 2026, 5, capturedAt, ['RB'], now)[0].severity).toBe('Warning');
  data.players[0].availability = null;
  expect(rosterAlerts(data, '10', 2026, 5, capturedAt, ['RB'], now)).toEqual([]);
});
it.each([undefined, null, '', 'ACTIVE'])(
  'does not emit an injury notice for status %s',
  (availability) => {
    const data = team();
    data.players[0].availability = availability;
    expect(rosterAlerts(data, '10', 2026, 5, capturedAt, ['RB'], now)).toEqual([]);
  },
);
it('discloses stale and missing lineup inputs without notices for absent injury status', () => {
  const data = team();
  const stale = rosterAlerts(data, '10', 2026, 5, '2020-01-01', ['RB'], now);
  expect(stale).toHaveLength(1);
  expect(stale[0].severity).toBe('Warning');
  data.players[0].availability = undefined;
  data.players[0].locked = undefined;
  data.players[0].projectedPoints = undefined;
  const unknown = rosterAlerts(data, '10', 2026, 5, capturedAt, undefined, now);
  expect(unknown.every((alert) => alert.severity === 'Info')).toBe(true);
  expect(unknown).toHaveLength(3);
  expect(unknown.map((alert) => alert.message).join(' ')).not.toContain('injury');
});
it('handles bye/lineup gaps, roster changes and week/team identity', () => {
  const data = team();
  data.players[0].availability = null;
  data.players[0].bye = true;
  const first = rosterAlerts(data, '10', 2026, 5, capturedAt, ['RB', 'WR'], now);
  expect(first).toHaveLength(2);
  data.players[0].starter = false;
  expect(
    rosterAlerts(data, '10', 2026, 5, capturedAt, ['RB'], now).some(
      (alert) => alert.playerId === 'a',
    ),
  ).toBe(false);
  expect(rosterAlerts(team(), '20', 2026, 5, capturedAt, ['RB'], now)[0].id).not.toBe(
    rosterAlerts(team(), '10', 2026, 5, capturedAt, ['RB'], now)[0].id,
  );
  expect(rosterAlerts(team(), '10', 2026, 6, capturedAt, ['RB'], now)[0].id).not.toBe(
    rosterAlerts(team(), '10', 2026, 5, capturedAt, ['RB'], now)[0].id,
  );
});
it('keeps bounded dismissal preferences private to the browser account', () => {
  const storage = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
  saveAlertDismissals('owner-a', ['condition', 'condition']);
  expect(readAlertDismissals('owner-a')).toEqual(['condition']);
  expect(readAlertDismissals('owner-b')).toEqual([]);
  expect(readAlertDismissals(undefined)).toEqual([]);
  saveAlertDismissals(
    'owner-a',
    Array.from({ length: 250 }, (_, index) => String(index)),
  );
  expect(readAlertDismissals('owner-a')).toHaveLength(200);
});

// @vitest-environment node
const get = vi.hoisted(() => vi.fn());
vi.mock('axios', () => ({ default: { get } }));
import { gameSchedule } from '../live-projections.server';
const capturedAt = '2026-10-15T20:00:00.000Z';
const game = (date = '2026-10-18T17:00Z') => ({
  date,
  status: { type: { state: 'pre', name: 'STATUS_SCHEDULED' } },
  competitions: [{ timeValid: true, competitors: [{ team: { id: '28', abbreviation: 'WSH' } }] }],
});
afterEach(() => vi.useRealTimers());
it('only accepts provider-confirmed kickoff times with an explicit offset', () => {
  expect(gameSchedule(game(), capturedAt).kickoffAt).toBe('2026-10-18T17:00:00.000Z');
  for (const date of ['invalid', '2026-10-18', '2026-10-18T17:00'])
    expect(gameSchedule(game(date), capturedAt).kickoffAt).toBeUndefined();
  expect(
    gameSchedule({ ...game(), competitions: [{ timeValid: false }] }, capturedAt).kickoffAt,
  ).toBeUndefined();
  expect(gameSchedule({ ...game(), competitions: [{}] }, capturedAt).kickoffAt).toBeUndefined();
});
it.each([
  ['STATUS_POSTPONED', 'postponed'],
  ['STATUS_CANCELED', 'canceled'],
  ['STATUS_RESCHEDULED', 'rescheduled'],
] as const)('keeps %s explicit', (name, expected) => {
  const result = gameSchedule({ ...game(), status: { type: { state: 'pre', name } } }, capturedAt);
  expect(result.status).toBe(expected);
  expect(result.kickoffAt).toBe(
    expected === 'rescheduled' ? '2026-10-18T17:00:00.000Z' : undefined,
  );
});
it('coalesces remaining-time and schedule reads, maps both provider team keys, refreshes changed times', async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(capturedAt);
  get.mockReset().mockResolvedValue({
    data: { events: [game()], week: { teamsOnBye: [{ id: '4', abbreviation: 'CIN' }] } },
  });
  const { nflSchedule, nflRemaining } = await import('../live-projections.server');
  const [schedule, remaining] = await Promise.all([
    nflSchedule(2026, 6),
    nflRemaining(2026, 6),
    nflSchedule(2026, 6),
  ]);
  expect(get).toHaveBeenCalledTimes(1);
  expect(schedule.get('WAS')).toEqual(schedule.get('28'));
  expect(schedule.get('CIN')?.status).toBe('bye');
  expect(schedule.get('4')?.status).toBe('bye');
  expect(schedule.has('BUF')).toBe(false);
  expect(remaining.get('WAS')).toBe(1);
  get.mockResolvedValue({
    data: {
      events: [
        {
          ...game('2026-10-19T00:20Z'),
          status: { type: { state: 'pre', name: 'STATUS_SCHEDULED' } },
        },
      ],
    },
  });
  vi.advanceTimersByTime(45_001);
  const next = await nflSchedule(2026, 6);
  expect(next.get('WAS')).toMatchObject({
    status: 'rescheduled',
    kickoffAt: '2026-10-19T00:20:00.000Z',
  });
  expect(next.get('WAS')?.capturedAt).not.toBe(capturedAt);
  expect(get).toHaveBeenCalledTimes(2);
});
it('retains changed kickoff history when another period refreshes and after failed reads', async () => {
  vi.resetModules();
  vi.useFakeTimers();
  get.mockReset().mockResolvedValue({ data: { events: [game()] } });
  const { nflSchedule } = await import('../live-projections.server');
  await nflSchedule(2026, 6);
  await nflSchedule(2025, 6);
  vi.advanceTimersByTime(45_001);
  await nflSchedule(2025, 6);
  get.mockRejectedValueOnce(new Error('Unavailable'));
  await expect(nflSchedule(2026, 6)).rejects.toThrow('Unavailable');
  vi.advanceTimersByTime(45_001);
  get.mockResolvedValue({ data: { events: [game('2026-10-19T00:20Z')] } });
  expect((await nflSchedule(2026, 6)).get('WAS')).toMatchObject({
    status: 'rescheduled',
    kickoffAt: '2026-10-19T00:20:00.000Z',
  });
  vi.advanceTimersByTime(45_001);
  await nflSchedule(2025, 6);
  expect((await nflSchedule(2026, 6)).get('WAS')?.status).toBe('rescheduled');
});
it('bounds retained kickoff history to the most recently refreshed 36 periods', async () => {
  vi.resetModules();
  vi.useFakeTimers();
  get.mockReset().mockResolvedValue({ data: { events: [game()] } });
  const { nflSchedule } = await import('../live-projections.server');
  for (const year of [2024, 2025, 2026])
    for (let week = 1; week <= 12; week++) await nflSchedule(year, week);
  vi.advanceTimersByTime(45_001);
  await nflSchedule(2024, 1);
  await nflSchedule(2026, 13);
  get.mockResolvedValue({ data: { events: [game('2026-10-19T00:20Z')] } });
  vi.advanceTimersByTime(45_001);
  expect((await nflSchedule(2024, 1)).get('WAS')?.status).toBe('rescheduled');
  expect((await nflSchedule(2024, 2)).get('WAS')?.status).toBe('scheduled');
});
it('bounds unavailable-read retries until the cache expires', async () => {
  vi.resetModules();
  vi.useFakeTimers();
  get.mockReset().mockRejectedValue(new Error('Unavailable'));
  const { nflSchedule, nflRemaining } = await import('../live-projections.server');
  await expect(nflSchedule(2026, 6)).rejects.toThrow('Unavailable');
  await expect(nflRemaining(2026, 6)).rejects.toThrow('Unavailable');
  expect(get).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(45_001);
  get.mockResolvedValue({ data: { events: [] } });
  await expect(nflSchedule(2026, 6)).rejects.toThrow('NFL schedule unavailable');
  expect(get).toHaveBeenCalledTimes(2);
});
